import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class BidEvaluation(Base):
    __tablename__ = "bid_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    bid_number = Column(String(100), unique=True, index=True)
    tender_title = Column(String(255))
    organization_name = Column(String(255), default="Government e-Marketplace (GeM)")
    bidder_name = Column(String(255))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(50), default="PROCESSING") # PROCESSING, COMPLETED, FAILED
    
    # Overview metrics
    total_clauses = Column(Integer, default=0)
    passed_clauses = Column(Integer, default=0)
    failed_clauses = Column(Integer, default=0)
    warning_clauses = Column(Integer, default=0)
    compliance_score = Column(Float, default=0.0) # Percentage 0-100%
    risk_level = Column(String(50), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    executive_summary = Column(Text, nullable=True)

    documents = relationship("UploadedDocument", back_populates="bid", cascade="all, delete-orphan")
    results = relationship("ComplianceResult", back_populates="bid", cascade="all, delete-orphan")

class UploadedDocument(Base):
    __tablename__ = "uploaded_documents"

    id = Column(Integer, primary_key=True, index=True)
    bid_id = Column(Integer, ForeignKey("bid_evaluations.id"))
    filename = Column(String(255))
    filepath = Column(String(512))
    doc_type = Column(String(50)) # TENDER, BIDDER_PACKAGE, FINANCIAL_CERT, OEM_MAI, MII_DECLARATION
    file_size = Column(Integer)
    page_count = Column(Integer, default=0)
    extracted_text_json = Column(Text, nullable=True) # JSON stored page text metadata

    bid = relationship("BidEvaluation", back_populates="documents")

class ComplianceResult(Base):
    __tablename__ = "compliance_results"

    id = Column(Integer, primary_key=True, index=True)
    bid_id = Column(Integer, ForeignKey("bid_evaluations.id"))
    
    clause_code = Column(String(50))
    category = Column(String(100)) # FINANCIAL, TECHNICAL, MII_LAND_BORDER, CERTIFICATIONS, LEGAL
    clause_title = Column(String(255))
    tender_requirement = Column(Text)
    is_mandatory = Column(Boolean, default=True)
    
    status = Column(String(50)) # COMPLIANT, NON_COMPLIANT, NEEDS_REVIEW
    bidder_evidence = Column(Text, nullable=True)
    source_doc_name = Column(String(255), nullable=True)
    page_number = Column(Integer, nullable=True)
    confidence_score = Column(Float, default=1.0)
    ai_rationale = Column(Text, nullable=True)
    risk_notes = Column(Text, nullable=True)

    bid = relationship("BidEvaluation", back_populates="results")
