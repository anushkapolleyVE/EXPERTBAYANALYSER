from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Pilot schemas
class PilotBase(BaseModel):
    pilot_code: str
    name: str
    description: Optional[str] = None
    status: str
    initial_eng_questions_count: int = 180
    initial_retrieval_probes_count: int = 84
    total_starting_materials: int = 264

class PilotResponse(PilotBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# TestCase schemas
class TestCaseCreate(BaseModel):
    case_id: str
    test_category: str
    question_prompt: str
    test_type: str
    expected_answer: Optional[str] = None
    actual_ai_answer: str
    retrieved_documents: Optional[str] = None
    reference_sources: Optional[str] = None
    source_url: Optional[str] = None
    product_category: Optional[str] = None
    brand: Optional[str] = None
    model_number: Optional[str] = None
    market_region: Optional[str] = "India"
    language: Optional[str] = "English"
    safety_sensitivity: Optional[str] = "Low"
    privacy_sensitivity: Optional[str] = "Low"
    evaluation_status: Optional[str] = "Awaiting Review"
    held_out_flag: Optional[bool] = False
    test_set_designation: Optional[str] = "Starting Source Material"
    notes: Optional[str] = None

class TestCaseUpdate(BaseModel):
    question_prompt: Optional[str] = None
    expected_answer: Optional[str] = None
    actual_ai_answer: Optional[str] = None
    product_category: Optional[str] = None
    brand: Optional[str] = None
    evaluation_status: Optional[str] = None
    is_excluded: Optional[bool] = None
    exclusion_reason: Optional[str] = None
    notes: Optional[str] = None

class TestCaseResponse(BaseModel):
    id: int
    case_id: str
    test_category: str
    question_prompt: str
    test_type: str
    expected_answer: Optional[str] = None
    actual_ai_answer: str
    retrieved_documents: Optional[str] = None
    reference_sources: Optional[str] = None
    source_url: Optional[str] = None
    product_category: Optional[str] = None
    brand: Optional[str] = None
    model_number: Optional[str] = None
    market_region: Optional[str] = "India"
    language: Optional[str] = "English"
    safety_sensitivity: Optional[str] = "Low"
    privacy_sensitivity: Optional[str] = "Low"
    evaluation_status: str
    held_out_flag: bool
    test_set_designation: str
    is_excluded: bool
    exclusion_reason: Optional[str] = None
    notes: Optional[str] = None
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Reviewer schemas
class ReviewerCreate(BaseModel):
    reviewer_id: str
    full_name: str
    reviewer_type: str
    email: str
    professional_profile: Optional[str] = None
    work_experience: Optional[str] = None
    technical_skills: Optional[str] = None
    years_experience: int = 5
    credentials: Optional[str] = None
    evaluation_experience: Optional[str] = None
    relevant_project_experience: Optional[str] = None
    product_categories: Optional[str] = None
    brands_covered: Optional[str] = None
    models_covered: Optional[str] = None
    language_coverage: Optional[str] = None
    india_market_coverage: Optional[str] = None
    official_guidance_familiarity: Optional[str] = "High"
    regulator_guidance_familiarity: Optional[str] = "High"
    availability_status: Optional[str] = "Available"
    hourly_rate: Optional[str] = "$75/hr"
    verification_status: Optional[str] = "Nominated"
    qualification_verified: Optional[bool] = False
    qualification_notes: Optional[str] = None
    independence_verified: Optional[bool] = False
    independence_notes: Optional[str] = None
    conflict_of_interest_disclosed: Optional[bool] = True
    coi_has_disqualifying_conflict: Optional[bool] = False
    coi_details: Optional[str] = None
    coi_mitigation_decision: Optional[str] = "Approved - No Conflict"

class ReviewerVerifyUpdate(BaseModel):
    verification_status: Optional[str] = None
    qualification_verified: Optional[bool] = None
    qualification_notes: Optional[str] = None
    independence_verified: Optional[bool] = None
    independence_notes: Optional[str] = None
    coi_mitigation_decision: Optional[str] = None

class ReviewerResponse(BaseModel):
    id: int
    reviewer_id: str
    full_name: str
    reviewer_type: str
    email: str
    professional_profile: Optional[str] = None
    work_experience: Optional[str] = None
    technical_skills: Optional[str] = None
    years_experience: int
    credentials: Optional[str] = None
    evaluation_experience: Optional[str] = None
    relevant_project_experience: Optional[str] = None
    product_categories: Optional[str] = None
    brands_covered: Optional[str] = None
    models_covered: Optional[str] = None
    language_coverage: Optional[str] = None
    india_market_coverage: Optional[str] = None
    official_guidance_familiarity: Optional[str] = None
    regulator_guidance_familiarity: Optional[str] = None
    availability_status: str
    hourly_rate: Optional[str] = None
    verification_status: str
    qualification_verified: bool
    qualification_notes: Optional[str] = None
    independence_verified: bool
    independence_notes: Optional[str] = None
    conflict_of_interest_disclosed: bool
    coi_has_disqualifying_conflict: bool
    coi_details: Optional[str] = None
    coi_mitigation_decision: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Judgment schemas
class JudgmentCreate(BaseModel):
    case_id: int
    reviewer_id: int
    is_draft: bool = False
    accuracy_score: str
    citation_score: str
    retrieval_score: str
    privacy_score: str
    safety_score: str
    overall_verdict: str
    severity: Optional[str] = "None"
    failure_category: Optional[str] = "None"
    rationale: str
    evidence_notes: Optional[str] = None
    citation_links_verified: Optional[bool] = True
    rubric_version: Optional[str] = "v1.2-standard"
    amendment_reason: Optional[str] = None

class JudgmentResponse(BaseModel):
    id: int
    judgment_id: str
    case_id: int
    reviewer_id: int
    is_draft: bool
    accuracy_score: str
    citation_score: str
    retrieval_score: str
    privacy_score: str
    safety_score: str
    overall_verdict: str
    severity: str
    failure_category: str
    rationale: str
    evidence_notes: Optional[str] = None
    citation_links_verified: bool
    rubric_version: str
    is_locked: bool
    amendment_version: int
    amendment_reason: Optional[str] = None
    submitted_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

# Disagreement schemas
class DisagreementResolve(BaseModel):
    final_resolution_verdict: str
    adjudication_rationale: str
    adjudicator_id: int

# Finding schemas
class FindingCreate(BaseModel):
    case_id: int
    category: str
    severity: str
    description: str
    evidence: str
    reviewer_id: Optional[int] = None
    impact: Optional[str] = None
    reproducibility: Optional[str] = "Always"
    status: Optional[str] = "Open"
    remediation_recommendation: Optional[str] = None
    blocks_pilot_signoff: Optional[bool] = False

class FindingUpdate(BaseModel):
    status: Optional[str] = None
    remediation_recommendation: Optional[str] = None
    blocks_pilot_signoff: Optional[bool] = None
