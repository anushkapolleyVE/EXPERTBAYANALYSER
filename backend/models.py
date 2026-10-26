import datetime
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from .database import Base

class Pilot(Base):
    __tablename__ = "pilots"

    id = Column(Integer, primary_key=True, index=True)
    pilot_code = Column(String(50), unique=True, index=True, default="EXBAY-AI-PILOT-2026")
    name = Column(String(200), default="ExpertBay AI Quality & Privacy Evaluation Pilot")
    description = Column(Text, default="Independent evaluation of engineering answers and Indian home-service product retrieval.")
    status = Column(String(50), default="Active")  # Planning, Active, Review In Progress, Adjudication, Completed
    initial_eng_questions_count = Column(Integer, default=180)
    initial_retrieval_probes_count = Column(Integer, default=84)
    total_starting_materials = Column(Integer, default=264)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), unique=True, index=True) # TC-ENG-001, TC-PROBE-002, etc.
    test_category = Column(String(100)) # Engineering Draft Question, Product Retrieval Smoke Probe, Natural Language Question, Held-Out Case
    question_prompt = Column(Text, nullable=False)
    test_type = Column(String(100)) # Accuracy, Retrieval, Citation, Privacy, Safety, End-to-End
    expected_answer = Column(Text, nullable=True)
    actual_ai_answer = Column(Text, nullable=False)
    retrieved_documents = Column(Text, nullable=True) # JSON or formatted text of retrieved chunks
    reference_sources = Column(Text, nullable=True) # Authoritative manuals/guidance
    source_url = Column(String(500), nullable=True)
    product_category = Column(String(100), nullable=True) # Air Conditioners, Water Purifiers, Refrigerators, etc.
    brand = Column(String(100), nullable=True) # Voltas, Kent, Godrej, LG India, etc.
    model_number = Column(String(100), nullable=True)
    market_region = Column(String(100), default="India")
    language = Column(String(50), default="English")
    safety_sensitivity = Column(String(50), default="Low") # Low, Medium, High, Critical
    privacy_sensitivity = Column(String(50), default="Low") # Low, Medium, High, Critical
    evaluation_status = Column(String(50), default="Awaiting Review") # Unreviewed Starting Material, Awaiting Review, In Progress, Reviewed, Disagreement, Adjudicated, Excluded
    held_out_flag = Column(Boolean, default=False)
    test_set_designation = Column(String(100), default="Starting Source Material")
    is_excluded = Column(Boolean, default=False)
    exclusion_reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    assignments = relationship("Assignment", back_populates="test_case", cascade="all, delete-orphan")
    judgments = relationship("Judgment", back_populates="test_case", cascade="all, delete-orphan")
    disagreements = relationship("Disagreement", back_populates="test_case", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="test_case", cascade="all, delete-orphan")

class Reviewer(Base):
    __tablename__ = "reviewers"

    id = Column(Integer, primary_key=True, index=True)
    reviewer_id = Column(String(50), unique=True, index=True) # DEMO-TECH-001, DEMO-DOMAIN-001
    full_name = Column(String(150), nullable=False)
    reviewer_type = Column(String(100), nullable=False) # Technical / AI Evaluation Reviewer, Home-Service Domain Reviewer
    email = Column(String(150), nullable=False)
    professional_profile = Column(Text, nullable=True)
    work_experience = Column(Text, nullable=True)
    technical_skills = Column(Text, nullable=True) # JSON list or string
    years_experience = Column(Integer, default=5)
    credentials = Column(String(300), nullable=True)
    evaluation_experience = Column(Text, nullable=True)
    relevant_project_experience = Column(Text, nullable=True)
    
    # Domain specific coverage
    product_categories = Column(Text, nullable=True) # JSON list e.g. ["Air Conditioners", "Refrigerators"]
    brands_covered = Column(Text, nullable=True) # JSON list e.g. ["Voltas", "Daikin India", "Godrej"]
    models_covered = Column(Text, nullable=True)
    language_coverage = Column(Text, nullable=True) # JSON detailed array
    india_market_coverage = Column(Text, nullable=True) # JSON with regions, standards
    official_guidance_familiarity = Column(String(50), default="High")
    regulator_guidance_familiarity = Column(String(50), default="High")
    
    # Status & Verification
    availability_status = Column(String(50), default="Available") # Available, Assigned, Capacity Reached, Inactive
    hourly_rate = Column(String(50), default="$75/hr")
    verification_status = Column(String(50), default="Nominated") # Nominated, Under Review, Verification Pending, Verified, Shortlisted, Approved, Rejected
    
    # Distinct Qualification vs Independence gates
    qualification_verified = Column(Boolean, default=False)
    qualification_notes = Column(Text, nullable=True)
    qualification_evidence = Column(Text, nullable=True)
    
    independence_verified = Column(Boolean, default=False)
    independence_notes = Column(Text, nullable=True)
    
    # Conflict of interest
    conflict_of_interest_disclosed = Column(Boolean, default=True)
    coi_has_disqualifying_conflict = Column(Boolean, default=False)
    coi_details = Column(Text, nullable=True) # JSON object
    coi_disclosure_date = Column(DateTime, default=datetime.datetime.utcnow)
    coi_mitigation_decision = Column(String(200), default="Approved - No implementation or authorship role")
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    assignments = relationship("Assignment", back_populates="reviewer")
    judgments = relationship("Judgment", back_populates="reviewer")

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(String(50), unique=True, index=True)
    case_id = Column(Integer, ForeignKey("test_cases.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("reviewers.id"), nullable=False)
    assigned_role = Column(String(50), default="Primary Reviewer") # Primary Reviewer, Secondary Reviewer, Adjudicator
    status = Column(String(50), default="Assigned") # Assigned, Accepted, In Progress, Completed, Reassigned, Overdue
    deadline = Column(String(50), default="2026-03-15")
    reassignment_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    test_case = relationship("TestCase", back_populates="assignments")
    reviewer = relationship("Reviewer", back_populates="assignments")

class Judgment(Base):
    __tablename__ = "judgments"

    id = Column(Integer, primary_key=True, index=True)
    judgment_id = Column(String(50), unique=True, index=True)
    case_id = Column(Integer, ForeignKey("test_cases.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("reviewers.id"), nullable=False)
    is_draft = Column(Boolean, default=False)
    
    # 5 Mandatory Dimensions
    accuracy_score = Column(String(50), default="Meets criteria") # Meets criteria, Partially meets criteria, Does not meet criteria, Unable to assess, Not applicable
    citation_score = Column(String(50), default="Meets criteria")
    retrieval_score = Column(String(50), default="Meets criteria")
    privacy_score = Column(String(50), default="Meets criteria")
    safety_score = Column(String(50), default="Meets criteria")
    
    # Overall
    overall_verdict = Column(String(50), default="Pass") # Pass, Issue, Critical Failure, Unable to Assess
    severity = Column(String(50), default="None") # None, Low, Medium, High, Critical
    failure_category = Column(String(100), default="None") # None, Hallucination, Incorrect Citation, Retrieval Failure, Privacy Risk, Safety Failure, Factual Inaccuracy
    
    rationale = Column(Text, nullable=False)
    evidence_notes = Column(Text, nullable=True)
    citation_links_verified = Column(Boolean, default=True)
    rubric_version = Column(String(50), default="v1.2-standard")
    
    # Preservation and immutability
    is_locked = Column(Boolean, default=True)
    amendment_version = Column(Integer, default=1)
    amendment_reason = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    test_case = relationship("TestCase", back_populates="judgments")
    reviewer = relationship("Reviewer", back_populates="judgments")

class Disagreement(Base):
    __tablename__ = "disagreements"

    id = Column(Integer, primary_key=True, index=True)
    disagreement_id = Column(String(50), unique=True, index=True)
    case_id = Column(Integer, ForeignKey("test_cases.id"), nullable=False)
    reviewer_a_id = Column(Integer, ForeignKey("reviewers.id"), nullable=False)
    reviewer_b_id = Column(Integer, ForeignKey("reviewers.id"), nullable=False)
    conflicting_dimensions = Column(Text, nullable=False) # JSON list e.g. ["citation_score", "safety_score"]
    conflicting_verdicts = Column(Text, nullable=False) # JSON e.g. {"reviewer_a": "Pass", "reviewer_b": "Critical Failure"}
    category = Column(String(100), default="Safety") # Factual correctness, Citation validity, Retrieval relevance, Privacy, Safety, Severity classification, Other
    status = Column(String(50), default="Pending Adjudication") # Pending Adjudication, In Review, Resolved
    adjudicator_id = Column(Integer, ForeignKey("reviewers.id"), nullable=True)
    final_resolution_verdict = Column(String(50), nullable=True) # Pass, Issue, Critical Failure
    adjudication_rationale = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    test_case = relationship("TestCase", back_populates="disagreements")

class Finding(Base):
    __tablename__ = "findings"

    id = Column(Integer, primary_key=True, index=True)
    finding_id = Column(String(50), unique=True, index=True) # FND-SAFE-001, FND-PRIV-001
    case_id = Column(Integer, ForeignKey("test_cases.id"), nullable=False)
    category = Column(String(100), nullable=False) # Safety Failure, Privacy Risk, Hallucination, Incorrect Citation, Retrieval Failure, Factual Inaccuracy
    severity = Column(String(50), nullable=False) # Critical, High, Medium, Low
    description = Column(Text, nullable=False)
    evidence = Column(Text, nullable=False)
    reviewer_id = Column(Integer, ForeignKey("reviewers.id"), nullable=True)
    impact = Column(Text, nullable=True)
    reproducibility = Column(String(50), default="Always") # Always, Intermittent, Edge Case
    status = Column(String(50), default="Open") # Open, In Remediation, Resolved, Verified Closed
    remediation_recommendation = Column(Text, nullable=True)
    blocks_pilot_signoff = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    test_case = relationship("TestCase", back_populates="findings")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    rec_id = Column(String(50), unique=True, index=True)
    improvement_area = Column(String(200), nullable=False)
    priority = Column(String(50), default="High") # Critical, High, Medium, Low
    evidence = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    responsible_role = Column(String(100), default="Engineering Lead")
    suggested_next_step = Column(Text, nullable=True)
    status = Column(String(50), default="Open") # Open, Planned, In Progress, Implemented
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    user = Column(String(100), default="System")
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
