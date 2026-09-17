import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_compliance import AIComplianceEngine
from app.services.vector_db import get_vector_store

def test_genuine_audit():
    print("=== Testing Genuine Dynamic Tender Extraction & Bid Audit ===")
    
    # 1. Sample Uploaded Tender Text
    sample_tender_text = """
    GOVERNMENT OF INDIA - GeM TENDER SPECIFICATION DOCUMENT
    Tender Ref: GEM/2026/RFP/98421
    Subject: Supply, Installation and Maintenance of Data Center Storage Arrays & Switches

    ELIGIBILITY CRITERIA:
    1. Financial Turnover: The bidder must have an Average Annual Turnover of at least INR 75 Lakhs during the last 3 financial years (FY 2021-22, 2022-23, 2023-24). Chartered Accountant certificate with UDIN mandatory.
    2. Past Experience: Bidder must have executed at least 2 similar IT storage contracts worth INR 30 Lakhs each in Central/State Govt or PSUs.
    3. Local Content Preference (Make in India): Offer must certify minimum 50% Local Content under Class-I Local Supplier category.
    4. Land Border Sharing: Bidder must comply with Rule 144(xi) of GFR 2017 regarding land border sharing countries.
    5. OEM Authorization: OEM Manufacturer Authorization Form (MAI) addressed to buyer required.
    6. Quality Certification: Valid ISO 27001 Information Security Management Certificate.
    7. Non-Blacklisting: Notarized affidavit on Rs. 100 stamp paper certifying company is not blacklisted by GeM.
    """

    # 2. Sample Uploaded Bidder Package Docs
    sample_bidder_docs = [
        {
            "filename": "CA_Turnover_UDIN_Certificate.pdf",
            "filepath": "/dummy/ca.pdf",
            "pages": [
                {
                    "page": 1,
                    "text": "CHARTERED ACCOUNTANT AUDIT CERTIFICATE. This is to certify that M/s Enterprise Tech Solutions Pvt Ltd has achieved average annual turnover of Rs 1.20 Crores in last 3 financial years. UDIN: 24098123AAAA4567.",
                    "has_ocr": False
                }
            ]
        },
        {
            "filename": "Past_Order_Completion.pdf",
            "filepath": "/dummy/po.pdf",
            "pages": [
                {
                    "page": 1,
                    "text": "WORK COMPLETION CERTIFICATE: M/s Enterprise Tech Solutions has successfully completed supply of SAN Storage Arrays to National Thermal Power Corporation (NTPC) worth Rs 38.5 Lakhs under Purchase Order PO-9812.",
                    "has_ocr": False
                }
            ]
        },
        {
            "filename": "MII_Local_Content_Declaration.pdf",
            "filepath": "/dummy/mii.pdf",
            "pages": [
                {
                    "page": 1,
                    "text": "MAKE IN INDIA SELF DECLARATION: We certify that our storage equipment contains 58% Local Content manufactured at Chennai, Tamil Nadu, qualifying as Class-I Local Supplier.",
                    "has_ocr": False
                }
            ]
        }
    ]

    # Run Genuine Audit
    bid_id = 999
    print("\n1. Dynamically Extracting Tender Clauses from uploaded Tender PDF...")
    clauses = AIComplianceEngine.extract_tender_clauses(sample_tender_text)
    print(f"   Success! Extracted {len(clauses)} dynamic clauses:")
    for c in clauses:
        print(f"   - [{c['clause_code']}] {c['clause_title']}: {c['tender_requirement'][:80]}...")

    print("\n2. Indexing Bidder Package & Running Vector RAG Compliance Audit...")
    audit_data = AIComplianceEngine.verify_bid_compliance(bid_id, sample_tender_text, sample_bidder_docs)

    print("\n3. Audit Results Summary:")
    print(f"   - Compliance Score: {audit_data['compliance_score']}%")
    print(f"   - Risk Assessment:  {audit_data['risk_level']} RISK")
    print(f"   - Passed Criteria:  {audit_data['passed_clauses']}/{audit_data['total_clauses']}")
    print(f"   - Failed Criteria:  {audit_data['failed_clauses']}")
    print(f"   - Needs Review:     {audit_data['warning_clauses']}")
    print("\nDetailed Clause Evaluation Matrix:")
    for r in audit_data["results"]:
        print(f"   [{r['status']}] {r['clause_code']} - {r['clause_title']}")
        print(f"        Evidence: \"{r['bidder_evidence'][:80]}...\" (Doc: {r['source_doc_name']}, Pg {r['page_number']})")
        print(f"        Rationale: {r['ai_rationale']}\n")

if __name__ == "__main__":
    test_genuine_audit()
