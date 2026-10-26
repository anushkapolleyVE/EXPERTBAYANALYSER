import os
import csv
import io
import json
import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .database import get_db, engine, Base
from .models import (
    Pilot, TestCase, Reviewer, Assignment, Judgment, Disagreement, Finding, Recommendation, AuditLog
)
from .schemas import (
    PilotResponse, TestCaseCreate, TestCaseUpdate, TestCaseResponse,
    ReviewerCreate, ReviewerVerifyUpdate, ReviewerResponse,
    JudgmentCreate, JudgmentResponse, DisagreementResolve,
    FindingCreate, FindingUpdate
)
from .seed import seed_database
from .auth import (
    authenticate_user, create_access_token,
    get_current_user, require_roles,
    require_write, require_verification, require_signoff, require_adjudication, require_any,
    DEMO_USERS
)

# Initialize database schema and seed if needed
Base.metadata.create_all(bind=engine)
try:
    seed_database()
except Exception as e:
    print(f"Seed note: {e}")

app = FastAPI(
    title="ExpertBay AI Quality & Privacy Evaluation Pilot API",
    description="Enterprise API for independent AI quality, retrieval, citation, and privacy evaluation.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def normalize_slash_middleware(request, call_next):
    # Automatically collapse duplicate slashes in URL path (e.g. /api//test-cases -> /api/test-cases)
    path = request.scope.get("path", "")
    if "//" in path:
        import re
        request.scope["path"] = re.sub(r"/+", "/", path)
    return await call_next(request)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ExpertBay AI Quality & Privacy Evaluation Pilot",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "database": "connected"
    }

# ==================== PILOT ENDPOINTS ====================
@app.get("/api/pilots", response_model=List[PilotResponse])
def get_pilots(db: Session = Depends(get_db)):
    return db.query(Pilot).all()

@app.get("/api/pilots/current")
def get_current_pilot(db: Session = Depends(get_db)):
    pilot = db.query(Pilot).first()
    if not pilot:
        raise HTTPException(status_code=404, detail="No active pilot found")
    return pilot

# ==================== TEST CASES ENDPOINTS ====================
@app.get("/api/test-cases", response_model=List[TestCaseResponse])
def get_test_cases(
    db: Session = Depends(get_db),
    category: Optional[str] = None,
    brand: Optional[str] = None,
    language: Optional[str] = None,
    status: Optional[str] = None,
    held_out: Optional[bool] = None,
    search: Optional[str] = None
):
    query = db.query(TestCase)
    if category:
        query = query.filter(TestCase.test_category == category)
    if brand:
        query = query.filter(TestCase.brand.ilike(f"%{brand}%"))
    if language:
        query = query.filter(TestCase.language == language)
    if status:
        query = query.filter(TestCase.evaluation_status == status)
    if held_out is not None:
        query = query.filter(TestCase.held_out_flag == held_out)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (TestCase.case_id.ilike(search_filter)) |
            (TestCase.question_prompt.ilike(search_filter)) |
            (TestCase.brand.ilike(search_filter)) |
            (TestCase.product_category.ilike(search_filter))
        )
    return query.order_by(TestCase.id.asc()).all()

@app.post("/api/test-cases/import/csv")
def import_test_cases_csv(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_write)
):
    """Bulk-import test cases from a CSV file. Duplicate case_ids are skipped with a warning."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted.")
    if file.size and file.size > 5 * 1024 * 1024:  # 5 MB guard
        raise HTTPException(status_code=413, detail="File too large. Maximum 5 MB.")

    content = file.file.read().decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(content))

    required_cols = {"case_id", "test_category", "question_prompt", "actual_ai_answer"}
    if not required_cols.issubset(set(reader.fieldnames or [])):
        raise HTTPException(
            status_code=422,
            detail=f"CSV must contain columns: {required_cols}. Found: {reader.fieldnames}"
        )

    imported, skipped, errors = [], [], []

    from .database import SessionLocal
    with SessionLocal() as db_inner:
        for row_num, row in enumerate(reader, start=2):
            # Sanitise: strip leading = + - @ to prevent CSV formula injection
            sanitised = {
                k: (v.lstrip("=+-@") if isinstance(v, str) else v)
                for k, v in row.items()
            }
            case_id = sanitised.get("case_id", "").strip()
            if not case_id:
                errors.append({"row": row_num, "reason": "Missing case_id"})
                continue
            existing = db_inner.query(TestCase).filter(TestCase.case_id == case_id).first()
            if existing:
                skipped.append(case_id)
                continue
            try:
                new_case = TestCase(
                    case_id=case_id,
                    test_category=sanitised.get("test_category", "Engineering Draft Question"),
                    question_prompt=sanitised.get("question_prompt", ""),
                    test_type=sanitised.get("test_type", "Accuracy"),
                    actual_ai_answer=sanitised.get("actual_ai_answer", ""),
                    expected_answer=sanitised.get("expected_answer") or None,
                    retrieved_documents=sanitised.get("retrieved_documents") or None,
                    reference_sources=sanitised.get("reference_sources") or None,
                    source_url=sanitised.get("source_url") or None,
                    product_category=sanitised.get("product_category") or None,
                    brand=sanitised.get("brand") or None,
                    model_number=sanitised.get("model_number") or None,
                    market_region=sanitised.get("market_region", "India"),
                    language=sanitised.get("language", "English"),
                    safety_sensitivity=sanitised.get("safety_sensitivity", "Low"),
                    privacy_sensitivity=sanitised.get("privacy_sensitivity", "Low"),
                    held_out_flag=sanitised.get("held_out_flag", "false").lower() == "true",
                    test_set_designation=sanitised.get("test_set_designation", "Starting Source Material"),
                    evaluation_status="Awaiting Review",
                    notes=sanitised.get("notes") or None,
                )
                db_inner.add(new_case)
                imported.append(case_id)
            except Exception as e:
                errors.append({"row": row_num, "case_id": case_id, "reason": str(e)})
        db_inner.commit()

    return {
        "imported": len(imported),
        "skipped_duplicates": len(skipped),
        "errors": errors,
        "imported_ids": imported,
        "skipped_ids": skipped,
    }


@app.post("/api/test-cases", response_model=TestCaseResponse)
def create_test_case(case_in: TestCaseCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_write)):
    existing = db.query(TestCase).filter(TestCase.case_id == case_in.case_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Case ID {case_in.case_id} already exists")
    
    new_case = TestCase(**case_in.dict())
    db.add(new_case)
    
    # Audit log
    audit = AuditLog(
        action="TestCase Created",
        entity_type="TestCase",
        entity_id=case_in.case_id,
        user="Admin",
        details=f"Created case {case_in.case_id} ({case_in.test_category})"
    )
    db.add(audit)
    db.commit()
    db.refresh(new_case)
    return new_case

@app.get("/api/test-cases/{case_id}", response_model=TestCaseResponse)
def get_test_case_detail(case_id: str, db: Session = Depends(get_db)):
    case = db.query(TestCase).filter((TestCase.case_id == case_id) | (TestCase.id == int(case_id) if case_id.isdigit() else False)).first()
    if not case:
        raise HTTPException(status_code=404, detail="Test case not found")
    return case

@app.put("/api/test-cases/{case_id}", response_model=TestCaseResponse)
def update_test_case(case_id: str, case_update: TestCaseUpdate, db: Session = Depends(get_db)):
    case = db.query(TestCase).filter((TestCase.case_id == case_id) | (TestCase.id == int(case_id) if case_id.isdigit() else False)).first()
    if not case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    update_data = case_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(case, key, value)
    
    case.version += 1
    case.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(case)
    return case

# ==================== REVIEWERS ENDPOINTS ====================
@app.get("/api/reviewers", response_model=List[ReviewerResponse])
def get_reviewers(
    db: Session = Depends(get_db),
    reviewer_type: Optional[str] = None,
    verification_status: Optional[str] = None,
    product_category: Optional[str] = None
):
    query = db.query(Reviewer)
    if reviewer_type:
        query = query.filter(Reviewer.reviewer_type == reviewer_type)
    if verification_status:
        query = query.filter(Reviewer.verification_status == verification_status)
    if product_category:
        query = query.filter(Reviewer.product_categories.ilike(f"%{product_category}%"))
    return query.all()

@app.post("/api/reviewers", response_model=ReviewerResponse)
def nominate_reviewer(rev_in: ReviewerCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_verification)):
    existing = db.query(Reviewer).filter(Reviewer.reviewer_id == rev_in.reviewer_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Reviewer ID {rev_in.reviewer_id} already exists")
    
    new_rev = Reviewer(**rev_in.dict())
    db.add(new_rev)
    
    audit = AuditLog(
        action="Reviewer Nominated",
        entity_type="Reviewer",
        entity_id=rev_in.reviewer_id,
        user="Admin",
        details=f"Nominated {rev_in.full_name} as {rev_in.reviewer_type}"
    )
    db.add(audit)
    db.commit()
    db.refresh(new_rev)
    return new_rev

@app.put("/api/reviewers/{reviewer_id}/verify", response_model=ReviewerResponse)
def verify_reviewer(reviewer_id: str, verify_data: ReviewerVerifyUpdate, db: Session = Depends(get_db), current_user: dict = Depends(require_verification)):
    rev = db.query(Reviewer).filter((Reviewer.reviewer_id == reviewer_id) | (Reviewer.id == int(reviewer_id) if reviewer_id.isdigit() else False)).first()
    if not rev:
        raise HTTPException(status_code=404, detail="Reviewer not found")
    
    update_dict = verify_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(rev, key, value)
    
    rev.updated_at = datetime.datetime.utcnow()
    
    audit = AuditLog(
        action="Reviewer Verification Updated",
        entity_type="Reviewer",
        entity_id=rev.reviewer_id,
        user="Compliance Officer",
        details=f"Updated verification for {rev.full_name}: Status={rev.verification_status}, Qual={rev.qualification_verified}, Indep={rev.independence_verified}"
    )
    db.add(audit)
    db.commit()
    db.refresh(rev)
    return rev

# ==================== ASSIGNMENTS ENDPOINTS ====================
@app.get("/api/assignments")
def get_assignments(db: Session = Depends(get_db)):
    assignments = db.query(Assignment).all()
    results = []
    for a in assignments:
        results.append({
            "id": a.id,
            "assignment_id": a.assignment_id,
            "case_id": a.case_id,
            "case_code": a.test_case.case_id if a.test_case else None,
            "case_prompt": a.test_case.question_prompt[:80] + "..." if a.test_case else "",
            "category": a.test_case.product_category if a.test_case else None,
            "reviewer_id": a.reviewer_id,
            "reviewer_name": a.reviewer.full_name if a.reviewer else None,
            "reviewer_code": a.reviewer.reviewer_id if a.reviewer else None,
            "reviewer_type": a.reviewer.reviewer_type if a.reviewer else None,
            "assigned_role": a.assigned_role,
            "status": a.status,
            "deadline": a.deadline,
            "reassignment_reason": a.reassignment_reason
        })
    return results

@app.post("/api/assignments")
def create_assignment(payload: dict, db: Session = Depends(get_db), current_user: dict = Depends(require_verification)):
    case_id = payload.get("case_id")
    reviewer_id = payload.get("reviewer_id")
    role = payload.get("assigned_role", "Primary Reviewer")
    deadline = payload.get("deadline", "2026-03-20")

    # Verify qualification match
    case = db.query(TestCase).filter(TestCase.id == case_id).first()
    reviewer = db.query(Reviewer).filter(Reviewer.id == reviewer_id).first()
    if not case or not reviewer:
        raise HTTPException(status_code=404, detail="Case or Reviewer not found")

    asgn_id = f"ASGN-{case.case_id}-{reviewer.reviewer_id}"
    assignment = Assignment(
        assignment_id=asgn_id,
        case_id=case.id,
        reviewer_id=reviewer.id,
        assigned_role=role,
        status="Assigned",
        deadline=deadline
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return {"message": "Assignment created", "assignment_id": asgn_id}

# ==================== JUDGMENTS ENDPOINTS ====================
@app.get("/api/judgments", response_model=List[JudgmentResponse])
def get_judgments(db: Session = Depends(get_db), case_id: Optional[int] = None, reviewer_id: Optional[int] = None):
    query = db.query(Judgment)
    if case_id:
        query = query.filter(Judgment.case_id == case_id)
    if reviewer_id:
        query = query.filter(Judgment.reviewer_id == reviewer_id)
    return query.all()

@app.post("/api/judgments", response_model=JudgmentResponse)
def submit_judgment(jdg_in: JudgmentCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_write)):
    case = db.query(TestCase).filter(TestCase.id == jdg_in.case_id).first()
    reviewer = db.query(Reviewer).filter(Reviewer.id == jdg_in.reviewer_id).first()
    if not case or not reviewer:
        raise HTTPException(status_code=404, detail="Case or Reviewer not found")

    jdg_id = f"JDG-{case.case_id}-{reviewer.reviewer_id}"
    
    # Check if already submitted
    existing = db.query(Judgment).filter(Judgment.judgment_id == jdg_id).first()
    if existing and existing.is_locked:
        # Require amendment
        if not jdg_in.amendment_reason:
            raise HTTPException(status_code=400, detail="Judgment is locked. An amendment reason is required to submit a revision.")
        existing.accuracy_score = jdg_in.accuracy_score
        existing.citation_score = jdg_in.citation_score
        existing.retrieval_score = jdg_in.retrieval_score
        existing.privacy_score = jdg_in.privacy_score
        existing.safety_score = jdg_in.safety_score
        existing.overall_verdict = jdg_in.overall_verdict
        existing.severity = jdg_in.severity or "None"
        existing.failure_category = jdg_in.failure_category or "None"
        existing.rationale = jdg_in.rationale
        existing.evidence_notes = jdg_in.evidence_notes
        existing.amendment_version += 1
        existing.amendment_reason = jdg_in.amendment_reason
        existing.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing

    new_judgment = Judgment(
        judgment_id=jdg_id,
        case_id=jdg_in.case_id,
        reviewer_id=jdg_in.reviewer_id,
        is_draft=jdg_in.is_draft,
        accuracy_score=jdg_in.accuracy_score,
        citation_score=jdg_in.citation_score,
        retrieval_score=jdg_in.retrieval_score,
        privacy_score=jdg_in.privacy_score,
        safety_score=jdg_in.safety_score,
        overall_verdict=jdg_in.overall_verdict,
        severity=jdg_in.severity or "None",
        failure_category=jdg_in.failure_category or "None",
        rationale=jdg_in.rationale,
        evidence_notes=jdg_in.evidence_notes,
        citation_links_verified=jdg_in.citation_links_verified if jdg_in.citation_links_verified is not None else True,
        rubric_version=jdg_in.rubric_version or "v1.2-standard",
        is_locked=not jdg_in.is_draft,
        amendment_version=1,
        submitted_at=datetime.datetime.utcnow()
    )
    db.add(new_judgment)

    # Check for disagreements if there is an existing judgment from another reviewer on the same case
    other_judgments = db.query(Judgment).filter(
        Judgment.case_id == jdg_in.case_id,
        Judgment.reviewer_id != jdg_in.reviewer_id,
        Judgment.is_draft == False
    ).all()

    if other_judgments and not jdg_in.is_draft:
        other = other_judgments[0]
        # Check if verdicts or scores differ
        verdict_diff = other.overall_verdict != new_judgment.overall_verdict
        dim_conflicts = []
        for dim in ["accuracy_score", "citation_score", "retrieval_score", "privacy_score", "safety_score"]:
            if getattr(other, dim) != getattr(new_judgment, dim):
                dim_conflicts.append(dim)
        
        if verdict_diff or dim_conflicts:
            # Create disagreement
            case.evaluation_status = "Disagreement"
            disag_id = f"DISAG-{case.case_id}-{datetime.datetime.utcnow().strftime('%M%S')}"
            disag = Disagreement(
                disagreement_id=disag_id,
                case_id=case.id,
                reviewer_a_id=other.reviewer_id,
                reviewer_b_id=new_judgment.reviewer_id,
                conflicting_dimensions=json.dumps(dim_conflicts),
                conflicting_verdicts=json.dumps({
                    "reviewer_a": {"name": other.reviewer.full_name, "verdict": other.overall_verdict, "severity": other.severity},
                    "reviewer_b": {"name": reviewer.full_name, "verdict": new_judgment.overall_verdict, "severity": new_judgment.severity}
                }),
                category="Safety" if "safety_score" in dim_conflicts else ("Privacy" if "privacy_score" in dim_conflicts else "Factual correctness"),
                status="Pending Adjudication"
            )
            db.add(disag)
        else:
            case.evaluation_status = "Reviewed"
    elif not jdg_in.is_draft:
        case.evaluation_status = "In Progress"

    # If critical failure or privacy risk, create a finding
    if jdg_in.overall_verdict in ["Critical Failure", "Issue"] and not jdg_in.is_draft:
        f_cat = "Safety Failure" if jdg_in.safety_score == "Does not meet criteria" else (
            "Privacy Risk" if jdg_in.privacy_score == "Does not meet criteria" else (
                "Incorrect Citation" if jdg_in.citation_score == "Does not meet criteria" else "Factual Inaccuracy"
            )
        )
        f_id = f"FND-{case.case_id}-{datetime.datetime.utcnow().strftime('%S')}"
        finding = Finding(
            finding_id=f_id,
            case_id=case.id,
            category=f_cat,
            severity=jdg_in.severity if jdg_in.severity != "None" else "High",
            description=f"Automated finding recorded from {reviewer.full_name} review.",
            evidence=jdg_in.evidence_notes or jdg_in.rationale[:200],
            reviewer_id=reviewer.id,
            impact="Risk evaluated during independent review",
            reproducibility="Always",
            status="Open",
            remediation_recommendation="Review system prompt and retrieval corpus grounding.",
            blocks_pilot_signoff=True if jdg_in.overall_verdict == "Critical Failure" else False
        )
        db.add(finding)

    db.commit()
    db.refresh(new_judgment)
    return new_judgment

# ==================== DISAGREEMENTS ENDPOINTS ====================
@app.get("/api/disagreements")
def get_disagreements(db: Session = Depends(get_db)):
    disags = db.query(Disagreement).all()
    results = []
    for d in disags:
        results.append({
            "id": d.id,
            "disagreement_id": d.disagreement_id,
            "case_id": d.case_id,
            "case_code": d.test_case.case_id if d.test_case else "",
            "case_prompt": d.test_case.question_prompt[:100] + "..." if d.test_case else "",
            "category": d.category,
            "reviewer_a_id": d.reviewer_a_id,
            "reviewer_b_id": d.reviewer_b_id,
            "conflicting_dimensions": json.loads(d.conflicting_dimensions) if d.conflicting_dimensions else [],
            "conflicting_verdicts": json.loads(d.conflicting_verdicts) if d.conflicting_verdicts else {},
            "status": d.status,
            "adjudicator_id": d.adjudicator_id,
            "final_resolution_verdict": d.final_resolution_verdict,
            "adjudication_rationale": d.adjudication_rationale,
            "resolved_at": d.resolved_at.isoformat() if d.resolved_at else None,
            "created_at": d.created_at.isoformat() if d.created_at else None
        })
    return results

@app.post("/api/disagreements/{disag_id}/resolve")
def resolve_disagreement(disag_id: str, resolve_in: DisagreementResolve, db: Session = Depends(get_db)):
    disag = db.query(Disagreement).filter((Disagreement.disagreement_id == disag_id) | (Disagreement.id == int(disag_id) if disag_id.isdigit() else False)).first()
    if not disag:
        raise HTTPException(status_code=404, detail="Disagreement record not found")

    disag.final_resolution_verdict = resolve_in.final_resolution_verdict
    disag.adjudication_rationale = resolve_in.adjudication_rationale
    disag.adjudicator_id = resolve_in.adjudicator_id
    disag.status = "Resolved"
    disag.resolved_at = datetime.datetime.utcnow()

    # Update case status
    if disag.test_case:
        disag.test_case.evaluation_status = "Adjudicated"

    audit = AuditLog(
        action="Disagreement Resolved",
        entity_type="Disagreement",
        entity_id=disag.disagreement_id,
        user=f"Adjudicator #{resolve_in.adjudicator_id}",
        details=f"Resolved with verdict '{resolve_in.final_resolution_verdict}'. Rationale: {resolve_in.adjudication_rationale[:100]}"
    )
    db.add(audit)
    db.commit()
    return {"message": "Disagreement successfully adjudicated and resolved"}

# ==================== FINDINGS & SAFETY FAILURES ====================
@app.get("/api/findings")
def get_findings(db: Session = Depends(get_db), severity: Optional[str] = None, status: Optional[str] = None):
    query = db.query(Finding)
    if severity:
        query = query.filter(Finding.severity == severity)
    if status:
        query = query.filter(Finding.status == status)
    findings = query.all()
    results = []
    for f in findings:
        results.append({
            "id": f.id,
            "finding_id": f.finding_id,
            "case_id": f.case_id,
            "case_code": f.test_case.case_id if f.test_case else "",
            "category": f.category,
            "severity": f.severity,
            "description": f.description,
            "evidence": f.evidence,
            "reviewer_id": f.reviewer_id,
            "impact": f.impact,
            "reproducibility": f.reproducibility,
            "status": f.status,
            "remediation_recommendation": f.remediation_recommendation,
            "blocks_pilot_signoff": f.blocks_pilot_signoff,
            "created_at": f.created_at.isoformat() if f.created_at else None
        })
    return results

@app.post("/api/findings")
def create_finding(finding_in: FindingCreate, db: Session = Depends(get_db)):
    f_obj = Finding(**finding_in.dict())
    db.add(f_obj)
    db.commit()
    db.refresh(f_obj)
    return f_obj

@app.put("/api/findings/{finding_id}")
def update_finding(finding_id: str, update_in: FindingUpdate, db: Session = Depends(get_db)):
    f = db.query(Finding).filter((Finding.finding_id == finding_id) | (Finding.id == int(finding_id) if finding_id.isdigit() else False)).first()
    if not f:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    update_data = update_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(f, key, value)
    
    f.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(f)
    return f

# ==================== RECOMMENDATIONS & AUDIT LOGS ====================
@app.get("/api/recommendations")
def get_recommendations(db: Session = Depends(get_db)):
    return db.query(Recommendation).all()

@app.get("/api/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.id.desc()).limit(100).all()

# ==================== ANALYTICS & DASHBOARD SUMMARY ====================
@app.get("/api/analytics/dashboard")
def get_dashboard_analytics(db: Session = Depends(get_db)):
    pilot = db.query(Pilot).first()
    cases = db.query(TestCase).all()
    judgments = db.query(Judgment).filter(Judgment.is_draft == False).all()
    disagreements = db.query(Disagreement).all()
    findings = db.query(Finding).all()

    # The starting source materials counts:
    # 180 Engineering Draft Questions + 84 Product Retrieval Smoke Probes = 264
    starting_eng = 180
    starting_probes = 84
    total_materials = 264

    # Calculate review counts
    reviewed_cases = [c for c in cases if c.evaluation_status in ["Reviewed", "Adjudicated"]]
    disagreement_cases = [c for c in cases if c.evaluation_status == "Disagreement"]
    in_progress_cases = [c for c in cases if c.evaluation_status == "In Progress"]
    awaiting_cases = [c for c in cases if c.evaluation_status == "Awaiting Review"]

    # Calculate judgments stats
    pass_judgments = [j for j in judgments if j.overall_verdict == "Pass"]
    issue_judgments = [j for j in judgments if j.overall_verdict == "Issue"]
    critical_judgments = [j for j in judgments if j.overall_verdict == "Critical Failure"]
    privacy_judgments = [j for j in judgments if j.privacy_score == "Does not meet criteria"]

    # Flowchart benchmark simulation / target stats for full pilot:
    # Flowchart: Total Cases: 264 | Pass: 198 (75%) | Issues: 42 (16%) | Critical: 12 (5%) | Privacy: 12 (5%)
    # Quality Score: 82% (Accuracy: 85%, Retrieval: 80%, Citation: 78%, Privacy: 95%, Safety: 88%)
    # Top Findings: Hallucinations: 18, Incorrect Citations: 12, Privacy Risks: 7, Safety Failures: 5
    # Reviewer Disagreements: Total 24 | Resolved 18 | Pending 6

    # Real database counts for current active items:
    total_active_cases = len(cases)
    total_judgments_count = len(judgments)

    # Disagreements stats
    resolved_disag = len([d for d in disagreements if d.status == "Resolved"])
    pending_disag = len([d for d in disagreements if d.status != "Resolved"])

    # Findings breakdown
    findings_by_cat = {
        "Hallucinations": len([f for f in findings if f.category == "Hallucination"]),
        "Incorrect Citations": len([f for f in findings if f.category == "Incorrect Citation"]),
        "Privacy Risks": len([f for f in findings if f.category == "Privacy Risk"]),
        "Safety Failures": len([f for f in findings if f.category == "Safety Failure"]),
        "Retrieval Failures": len([f for f in findings if f.category == "Retrieval Failure"]),
    }

    # Findings by severity
    findings_by_sev = {
        "Critical": len([f for f in findings if f.severity == "Critical"]),
        "High": len([f for f in findings if f.severity == "High"]),
        "Medium": len([f for f in findings if f.severity == "Medium"]),
        "Low": len([f for f in findings if f.severity == "Low"]),
    }

    return {
        "pilot": {
            "name": pilot.name if pilot else "ExpertBay AI Quality & Privacy Evaluation Pilot",
            "code": pilot.pilot_code if pilot else "EXBAY-2026",
            "status": pilot.status if pilot else "Active",
            "starting_materials": {
                "engineering_questions": starting_eng,
                "retrieval_smoke_probes": starting_probes,
                "total_initial": total_materials,
                "status_note": "UNREVIEWED STARTING MATERIAL: Initial 264 source items imported for evaluation pipeline."
            }
        },
        "flowchart_benchmark": {
            "total_cases": 264,
            "pass_count": 198,
            "pass_pct": 75,
            "issues_count": 42,
            "issues_pct": 16,
            "critical_count": 12,
            "critical_pct": 5,
            "privacy_count": 12,
            "privacy_pct": 5,
            "quality_score": 82,
            "score_trend": "+5%",
            "dimension_scores": {
                "accuracy": 85,
                "retrieval": 80,
                "citation": 78,
                "privacy": 95,
                "safety": 88
            },
            "top_findings": {
                "hallucinations": 18,
                "incorrect_citations": 12,
                "privacy_risks": 7,
                "safety_failures": 5
            },
            "disagreements": {
                "total": 24,
                "resolved": 18,
                "pending": 6
            }
        },
        "live_demo_data": {
            "cases_in_demo_db": total_active_cases,
            "reviewed_cases": len(reviewed_cases),
            "disagreements": len(disagreement_cases),
            "in_progress": len(in_progress_cases),
            "awaiting_review": len(awaiting_cases),
            "total_judgments_recorded": total_judgments_count,
            "pass_verdicts": len(pass_judgments),
            "issue_verdicts": len(issue_judgments),
            "critical_verdicts": len(critical_judgments),
            "privacy_violations": len(privacy_judgments),
            "findings_by_category": findings_by_cat,
            "findings_by_severity": findings_by_sev,
            "disagreements_summary": {
                "total": len(disagreements),
                "resolved": resolved_disag,
                "pending": pending_disag
            }
        }
    }

# ==================== PDF REPORT EXPORT (REPORTLAB) ====================
from fastapi.responses import Response
from .pdf_reports import generate_scorecard_pdf, generate_safety_privacy_pdf

@app.get("/api/reports/pdf/scorecard")
def export_scorecard_pdf(db: Session = Depends(get_db)):
    pilot = db.query(Pilot).first()
    cases = db.query(TestCase).all()
    judgments = db.query(Judgment).all()
    findings = db.query(Finding).all()
    disagreements = db.query(Disagreement).all()

    pdf_bytes = generate_scorecard_pdf(pilot, cases, judgments, findings, disagreements)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=ExpertBay_AI_Evaluation_Scorecard.pdf"}
    )

@app.get("/api/reports/pdf/safety-privacy")
def export_safety_privacy_pdf(db: Session = Depends(get_db)):
    pilot = db.query(Pilot).first()
    findings = db.query(Finding).all()

    pdf_bytes = generate_safety_privacy_pdf(pilot, findings)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=ExpertBay_Safety_Privacy_Report.pdf"}
    )

# ==================== PILOT SIGN-OFF WORKFLOW (STOP-GATE) ====================
@app.post("/api/pilot/sign-off")
def submit_pilot_sign_off(payload: dict, db: Session = Depends(get_db), current_user: dict = Depends(require_signoff)):
    signed_off_by = payload.get("signed_off_by", "Compliance Officer")
    notes = payload.get("sign_off_notes", "All criteria dispositioned.")

    # Check for blocking critical findings
    critical_open = db.query(Finding).filter(
        Finding.severity == "Critical",
        Finding.status != "Verified Closed"
    ).all()

    if critical_open:
        finding_ids = [f.finding_id for f in critical_open]
        raise HTTPException(
            status_code=400,
            detail=f"Pilot sign-off BLOCKED by critical findings gate: {len(critical_open)} critical issue(s) ({', '.join(finding_ids)}) remain unverified."
        )

    pilot = db.query(Pilot).first()
    if pilot:
        pilot.status = "Signed off by an authorized person"
        pilot.updated_at = datetime.datetime.utcnow()
    
    audit = AuditLog(
        action="Pilot Signed Off",
        entity_type="Pilot",
        entity_id=pilot.pilot_code if pilot else "PILOT-2026",
        user=signed_off_by,
        details=f"Formal sign-off approved. Notes: {notes}"
    )
    db.add(audit)
    db.commit()
    return {"message": "Pilot successfully signed off by authorized compliance lead.", "status": "Signed off by an authorized person"}

# ==================== AUTHENTICATION & SESSIONS ====================
@app.post("/api/auth/login")
def login(payload: dict):
    """
    Issue a real HS256 JWT token.
    Demo mode: any non-empty password is accepted for all demo accounts.
    POST body: { "email": "...", "password": "any" }
    Also accepts legacy { "email": "...", "role": "..." } for backwards compatibility.
    """
    email    = payload.get("email", "admin@demo-expertbay.org")
    password = payload.get("password", "demo")  # any non-empty value works in demo
    role_override = payload.get("role")          # legacy persona switcher support

    # Map UI role aliases to backend roles
    role_map = {
        "tech_reviewer": "technical_reviewer",
        "domain_reviewer_1": "domain_reviewer",
        "domain_reviewer_2": "domain_reviewer",
    }
    canonical_role = role_map.get(role_override, role_override) if role_override else None


    user = authenticate_user(email, password)
    if not user and canonical_role:
        # Legacy support: accept role-based quick-switch used by the UI persona switcher
        user = next(
            (u for u in DEMO_USERS.values() if u["role"] == canonical_role),
            None
        )
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials. Use a demo account email with any non-empty password."
        )



    token_data = {"sub": user["email"], "role": user["role"], "full_name": user["full_name"]}
    access_token = create_access_token(token_data)

    role_permissions = {
        "admin":              ["evaluate", "nominate", "verify", "adjudicate", "sign_off", "reports", "settings"],
        "pilot_coordinator":  ["nominate", "verify", "assign", "reports"],
        "technical_reviewer": ["evaluate"],
        "domain_reviewer":    ["evaluate"],
        "adjudicator":        ["evaluate", "adjudicate"],
        "stakeholder":        ["reports"],
    }

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user["email"],
            "role": user["role"],
            "full_name": user["full_name"],
            "permissions": role_permissions.get(user["role"], [])
        }
    }


@app.get("/api/auth/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


@app.get("/api/auth/demo-users")
def list_demo_users():
    """Return available demo user emails for the login screen (no passwords)."""
    return [
        {"email": u["email"], "role": u["role"], "full_name": u["full_name"]}
        for u in DEMO_USERS.values()
    ]

