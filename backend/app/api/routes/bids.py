import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import get_db
from app.models.models import BidEvaluation, UploadedDocument, ComplianceResult
from app.services.ocr_parser import DocumentParserService
from app.services.ai_compliance import AIComplianceEngine
from app.services.report_gen import PDFReportGenerator

router = APIRouter(prefix="/bids", tags=["bids"])

class OverrideRequest(BaseModel):
    result_id: int
    new_status: str # COMPLIANT, NON_COMPLIANT, NEEDS_REVIEW
    override_notes: str

@router.get("")
def list_bids(db: Session = Depends(get_db)):
    bids = db.query(BidEvaluation).order_by(BidEvaluation.created_at.desc()).all()
    return bids

@router.get("/{bid_id}")
def get_bid_details(bid_id: int, db: Session = Depends(get_db)):
    bid = db.query(BidEvaluation).filter(BidEvaluation.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid evaluation not found")
    
    docs = db.query(UploadedDocument).filter(UploadedDocument.bid_id == bid_id).all()
    results = db.query(ComplianceResult).filter(ComplianceResult.bid_id == bid_id).all()
    
    return {
        "bid": bid,
        "documents": docs,
        "results": results
    }

@router.post("/upload")
async def upload_bid_documents(
    bid_number: str = Form(...),
    tender_title: str = Form(...),
    bidder_name: str = Form(...),
    tender_file: UploadFile = File(...),
    bidder_files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    # Check if bid_number already exists
    existing = db.query(BidEvaluation).filter(BidEvaluation.bid_number == bid_number).first()
    if existing:
        bid_number = f"{bid_number}-{uuid.uuid4().hex[:4]}"

    bid = BidEvaluation(
        bid_number=bid_number,
        tender_title=tender_title,
        bidder_name=bidder_name,
        status="UPLOADED"
    )
    db.add(bid)
    db.commit()
    db.refresh(bid)

    bid_dir = os.path.join(settings.UPLOAD_DIR, str(bid.id))
    os.makedirs(bid_dir, exist_ok=True)

    # Save Tender File
    t_path = os.path.join(bid_dir, f"TENDER_{tender_file.filename}")
    with open(t_path, "wb") as f:
        shutil.copyfileobj(tender_file.file, f)

    t_doc = UploadedDocument(
        bid_id=bid.id,
        filename=tender_file.filename,
        filepath=t_path,
        doc_type="TENDER"
    )
    db.add(t_doc)

    # Save Bidder Files
    for b_file in bidder_files:
        b_path = os.path.join(bid_dir, f"BIDDER_{b_file.filename}")
        with open(b_path, "wb") as f:
            shutil.copyfileobj(b_file.file, f)

        b_doc = UploadedDocument(
            bid_id=bid.id,
            filename=b_file.filename,
            filepath=b_path,
            doc_type="BIDDER_PACKAGE"
        )
        db.add(b_doc)

    db.commit()
    return {"bid_id": bid.id, "message": "Documents uploaded successfully", "bid_number": bid.bid_number}

@router.post("/{bid_id}/analyze")
def analyze_bid(bid_id: int, db: Session = Depends(get_db)):
    bid = db.query(BidEvaluation).filter(BidEvaluation.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    docs = db.query(UploadedDocument).filter(UploadedDocument.bid_id == bid_id).all()
    tender_doc = next((d for d in docs if d.doc_type == "TENDER"), None)
    bidder_docs = [d for d in docs if d.doc_type != "TENDER"]

    if not tender_doc:
        raise HTTPException(status_code=400, detail="Tender document missing")

    # Extract text from Tender PDF
    tender_pages = DocumentParserService.extract_text_by_pages(tender_doc.filepath)
    tender_full_text = "\n".join([p["text"] for p in tender_pages])
    tender_doc.page_count = len(tender_pages)

    # Extract text from Bidder Document PDFs
    parsed_bidder_docs = []
    for b_doc in bidder_docs:
        pages = DocumentParserService.extract_text_by_pages(b_doc.filepath)
        b_doc.page_count = len(pages)
        parsed_bidder_docs.append({
            "filename": b_doc.filename,
            "filepath": b_doc.filepath,
            "pages": pages
        })

    # Execute AI Verification Pipeline
    audit_data = AIComplianceEngine.verify_bid_compliance(
        bid_id=bid.id,
        tender_text=tender_full_text,
        bidder_docs=parsed_bidder_docs
    )

    # Clean old results if re-analyzing
    db.query(ComplianceResult).filter(ComplianceResult.bid_id == bid.id).delete()

    for r in audit_data["results"]:
        c_res = ComplianceResult(
            bid_id=bid.id,
            clause_code=r["clause_code"],
            category=r["category"],
            clause_title=r["clause_title"],
            tender_requirement=r["tender_requirement"],
            is_mandatory=r["is_mandatory"],
            status=r["status"],
            bidder_evidence=r["bidder_evidence"],
            source_doc_name=r["source_doc_name"],
            page_number=r["page_number"],
            confidence_score=r["confidence_score"],
            ai_rationale=r["ai_rationale"],
            risk_notes=r["risk_notes"]
        )
        db.add(c_res)

    # Update Bid Overview fields
    bid.total_clauses = audit_data["total_clauses"]
    bid.passed_clauses = audit_data["passed_clauses"]
    bid.failed_clauses = audit_data["failed_clauses"]
    bid.warning_clauses = audit_data["warning_clauses"]
    bid.compliance_score = audit_data["compliance_score"]
    bid.risk_level = audit_data["risk_level"]
    bid.executive_summary = audit_data["executive_summary"]
    bid.status = "COMPLETED"

    db.commit()
    db.refresh(bid)

    return {
        "status": "COMPLETED",
        "bid_id": bid.id,
        "compliance_score": bid.compliance_score,
        "risk_level": bid.risk_level,
        "passed_clauses": bid.passed_clauses,
        "failed_clauses": bid.failed_clauses,
        "warning_clauses": bid.warning_clauses
    }

@router.post("/override")
def override_clause_status(req: OverrideRequest, db: Session = Depends(get_db)):
    result = db.query(ComplianceResult).filter(ComplianceResult.id == req.result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Compliance result record not found")

    result.status = req.new_status
    result.ai_rationale += f" [Manual Committee Override: {req.override_notes}]"
    db.commit()

    # Recalculate bid stats
    bid = db.query(BidEvaluation).filter(BidEvaluation.id == result.bid_id).first()
    if bid:
        all_res = db.query(ComplianceResult).filter(ComplianceResult.bid_id == bid.id).all()
        bid.passed_clauses = sum(1 for r in all_res if r.status == "COMPLIANT")
        bid.failed_clauses = sum(1 for r in all_res if r.status == "NON_COMPLIANT")
        bid.warning_clauses = sum(1 for r in all_res if r.status == "NEEDS_REVIEW")
        bid.compliance_score = round((bid.passed_clauses / len(all_res)) * 100, 1) if all_res else 0.0
        db.commit()

    return {"message": "Status updated successfully", "new_status": req.new_status}

@router.get("/{bid_id}/export-pdf")
def export_pdf_report(bid_id: int, db: Session = Depends(get_db)):
    bid = db.query(BidEvaluation).filter(BidEvaluation.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    
    results = db.query(ComplianceResult).filter(ComplianceResult.bid_id == bid_id).all()
    
    bid_dict = {
        "bid_number": bid.bid_number,
        "tender_title": bid.tender_title,
        "bidder_name": bid.bidder_name,
        "compliance_score": bid.compliance_score,
        "risk_level": bid.risk_level,
        "passed_clauses": bid.passed_clauses,
        "total_clauses": bid.total_clauses,
        "failed_clauses": bid.failed_clauses,
        "warning_clauses": bid.warning_clauses
    }
    
    res_list = [
        {
            "clause_code": r.clause_code,
            "category": r.category,
            "clause_title": r.clause_title,
            "tender_requirement": r.tender_requirement,
            "status": r.status,
            "ai_rationale": r.ai_rationale,
            "source_doc_name": r.source_doc_name,
            "page_number": r.page_number
        }
        for r in results
    ]

    pdf_path = PDFReportGenerator.generate_compliance_report(bid_dict, res_list)
    return FileResponse(pdf_path, media_type="application/pdf", filename=os.path.basename(pdf_path))

@router.post("/create-demo")
def create_demo_bid(db: Session = Depends(get_db)):
    """Creates a sample GeM Tender Evaluation pre-loaded with realistic documents & results."""
    demo_bid_number = f"GEM/2026/B/{uuid.uuid4().hex[:6].upper()}"
    
    bid = BidEvaluation(
        bid_number=demo_bid_number,
        tender_title="Procurement of High-Performance Laptops, Servers & IT Infrastructure Services",
        bidder_name="TechVision Systems Pvt Ltd",
        status="COMPLETED",
        total_clauses=7,
        passed_clauses=5,
        failed_clauses=1,
        warning_clauses=1,
        compliance_score=71.4,
        risk_level="MEDIUM",
        executive_summary="Audit completed for GeM Bid GEM/2026/B/89A2B. Overall Compliance Score: 71.4%. Passed: 5/7 criteria. Failed: 1 (Missing OEM Authorization Form MAI). Needs Review: 1 (Land Border Affidavit wording ambiguity)."
    )
    db.add(bid)
    db.commit()
    db.refresh(bid)

    # Sample demo compliance results
    demo_results = [
        {
            "clause_code": "GEM-FIN-01",
            "category": "FINANCIAL",
            "clause_title": "Average Annual Financial Turnover",
            "tender_requirement": "Minimum Average Annual Turnover of INR 50 Lakhs in last 3 financial years. CA Certificate with UDIN mandatory.",
            "is_mandatory": True,
            "status": "COMPLIANT",
            "bidder_evidence": "Certificate of Chartered Accountant: This is to certify that TechVision Systems Pvt Ltd has achieved Turnover of FY2023-24: Rs. 1.85 Crores, FY2022-23: Rs. 1.40 Crores, FY2021-22: Rs. 1.10 Crores. UDIN: 24058291AAAA12345.",
            "source_doc_name": "CA_Turnover_Certificate_UDIN.pdf",
            "page_number": 2,
            "confidence_score": 0.96,
            "ai_rationale": "CA Turnover Certificate verified with UDIN 24058291AAAA12345. Average Turnover INR 1.45 Crores exceeds required INR 50 Lakhs threshold.",
            "risk_notes": "Verified CA seal and turnover financial figures."
        },
        {
            "clause_code": "GEM-TEC-02",
            "category": "TECHNICAL",
            "clause_title": "Past Experience & Performance",
            "tender_requirement": "Executed similar IT infrastructure supply orders: 3 orders of 40% (Rs 20L) OR 2 orders of 50% (Rs 25L) OR 1 order of 80% (Rs 40L) value in last 3 years.",
            "is_mandatory": True,
            "status": "COMPLIANT",
            "bidder_evidence": "Purchase Order PO-7821 from State Electricity Board for supply of 120 Workstations worth Rs. 34.50 Lakhs. Completion Certificate dated 15-Jan-2025 attached.",
            "source_doc_name": "Past_Performance_Completion_Certs.pdf",
            "page_number": 4,
            "confidence_score": 0.94,
            "ai_rationale": "Order Completion Certificates provided for 2 similar projects exceeding 50% bid value.",
            "risk_notes": "Satisfies technical experience requirement."
        },
        {
            "clause_code": "GEM-REG-03",
            "category": "LEGAL_MII",
            "clause_title": "Make in India (MII) Local Content Declaration",
            "tender_requirement": "Self-declaration of Local Content % for Class-I Local Supplier (>= 50%) preference under Public Procurement MII order.",
            "is_mandatory": True,
            "status": "COMPLIANT",
            "bidder_evidence": "Make in India Certificate: We hereby declare that the offered IT equipment contains 62.5% Local Content with assembly and value addition at Bengaluru Plant, Karnataka.",
            "source_doc_name": "MII_Local_Content_Self_Declaration.pdf",
            "page_number": 1,
            "confidence_score": 0.98,
            "ai_rationale": "Valid Make in India Class-I Local Supplier declaration with 62.5% local value addition verified.",
            "risk_notes": "Class-I Local Supplier preference granted."
        },
        {
            "clause_code": "GEM-REG-04",
            "category": "LEGAL_MII",
            "clause_title": "Land Border Sharing Country Declaration",
            "tender_requirement": "Compliance certification with GFR 2017 Rule 144(xi) regarding land border sharing countries.",
            "is_mandatory": True,
            "status": "NEEDS_REVIEW",
            "bidder_evidence": "Undertaking: The company confirms it complies with all statutory regulations of Government of India.",
            "source_doc_name": "Statutory_Undertakings.pdf",
            "page_number": 3,
            "confidence_score": 0.72,
            "ai_rationale": "General statutory undertaking provided, but explicit reference to GFR 2017 Rule 144(xi) Land Border clause is unmentioned.",
            "risk_notes": "Requires clarification or revised stamp paper undertaking."
        },
        {
            "clause_code": "GEM-DOC-05",
            "category": "DOCUMENTARY",
            "clause_title": "OEM Manufacturer Authorization (MAI)",
            "tender_requirement": "OEM Authorization Form (MAI) addressed to buyer for server components.",
            "is_mandatory": True,
            "status": "NON_COMPLIANT",
            "bidder_evidence": "No OEM authorization letter addressed to buyer attached in bidder submission folder.",
            "source_doc_name": "Bidder_Technical_Proposal.pdf",
            "page_number": 12,
            "confidence_score": 0.90,
            "ai_rationale": "Bidder is an authorized reseller but failed to attach the mandatory OEM Manufacturer Authorization (MAI) form.",
            "risk_notes": "High Risk - Mandatory rejection clause if non-manufacturers fail to attach OEM MAI."
        },
        {
            "clause_code": "GEM-DOC-06",
            "category": "CERTIFICATIONS",
            "clause_title": "ISO Quality Certifications",
            "tender_requirement": "Valid ISO 9001:2015 Quality Management Certificate.",
            "is_mandatory": False,
            "status": "COMPLIANT",
            "bidder_evidence": "Certificate ISO 9001:2015 registration no. ISO-IN-98721 valid through 30-Nov-2027.",
            "source_doc_name": "ISO_Certificates.pdf",
            "page_number": 1,
            "confidence_score": 0.95,
            "ai_rationale": "ISO 9001:2015 Quality Management Certificate verified active and valid.",
            "risk_notes": "Standard quality criteria satisfied."
        },
        {
            "clause_code": "GEM-LEG-07",
            "category": "LEGAL",
            "clause_title": "Non-Blacklisting & Debarment Affidavit",
            "tender_requirement": "Self-declaration affidavit on Stamp Paper stating bidder has not been debarred / blacklisted by GeM or Govt.",
            "is_mandatory": True,
            "status": "COMPLIANT",
            "bidder_evidence": "Notarized Affidavit on Rs. 100 Stamp Paper: TechVision Systems Pvt Ltd is not blacklisted or debarred by any Central/State Govt or GeM portal as on date.",
            "source_doc_name": "Non_Blacklisting_Affidavit_Stamp.pdf",
            "page_number": 1,
            "confidence_score": 0.97,
            "ai_rationale": "Notarized non-blacklisting affidavit on stamp paper verified.",
            "risk_notes": "Legal clearance verified."
        }
    ]

    for r in demo_results:
        c_res = ComplianceResult(
            bid_id=bid.id,
            **r
        )
        db.add(c_res)

    db.commit()
    return {"message": "Demo bid created successfully", "bid_id": bid.id, "bid_number": demo_bid_number}
