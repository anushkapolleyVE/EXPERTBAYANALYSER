import io
import csv
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

def get_admin_token() -> str:
    """Login as admin and return a real JWT token."""
    resp = client.post("/api/auth/login", json={
        "email": "admin@demo-expertbay.org",
        "password": "demo"
    })
    assert resp.status_code == 200
    return resp.json()["access_token"]

def get_token_for_role(role: str) -> str:
    """Login as a specific role using the legacy role-switcher."""
    resp = client.post("/api/auth/login", json={
        "email": f"{role}@demo-expertbay.org",
        "password": "demo",
        "role": role
    })
    assert resp.status_code == 200
    return resp.json()["access_token"]

def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# -----------------------------------------------------------------------------
# 1. Health check (public)
# -----------------------------------------------------------------------------

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "ExpertBay AI Quality & Privacy Evaluation Pilot"


# -----------------------------------------------------------------------------
# 2. Pilot data integrity
# -----------------------------------------------------------------------------

def test_get_pilots():
    response = client.get("/api/pilots")
    assert response.status_code == 200
    pilots = response.json()
    assert len(pilots) >= 1
    assert pilots[0]["initial_eng_questions_count"] == 180
    assert pilots[0]["initial_retrieval_probes_count"] == 84
    assert pilots[0]["total_starting_materials"] == 264


# -----------------------------------------------------------------------------
# 3. JWT Authentication
# -----------------------------------------------------------------------------

def test_login_returns_real_jwt():
    resp = client.post("/api/auth/login", json={
        "email": "admin@demo-expertbay.org",
        "password": "demo"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == "admin"
    # Token must not be the old mock string
    assert not data["access_token"].startswith("jwt_mock_token_")

def test_login_invalid_email_rejected():
    resp = client.post("/api/auth/login", json={
        "email": "nobody@nowhere.com",
        "password": "demo"
    })
    assert resp.status_code == 401

def test_get_me_requires_auth():
    # No token ? 401
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401

def test_get_me_with_valid_token():
    token = get_admin_token()
    resp = client.get("/api/auth/me", headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.json()["role"] == "admin"

def test_demo_users_list():
    resp = client.get("/api/auth/demo-users")
    assert resp.status_code == 200
    users = resp.json()
    roles = [u["role"] for u in users]
    assert "admin" in roles
    assert "technical_reviewer" in roles
    assert "domain_reviewer" in roles
    assert "adjudicator" in roles
    assert "stakeholder" in roles


# -----------------------------------------------------------------------------
# 4. Role-based access control (RBAC) -- protected write endpoints
# -----------------------------------------------------------------------------

def test_create_test_case_requires_auth():
    """POST /api/test-cases must reject unauthenticated requests."""
    payload = {
        "case_id": "TC-RBAC-ANON",
        "test_category": "Engineering Draft Question",
        "question_prompt": "Anon write test",
        "actual_ai_answer": "Should be blocked",
    }
    resp = client.post("/api/test-cases", json=payload)
    assert resp.status_code == 401

def test_create_test_case_stakeholder_forbidden():
    """Stakeholder is read-only -- must receive 403 on POST."""
    token = get_token_for_role("stakeholder")
    payload = {
        "case_id": "TC-RBAC-STAKEHOLDER",
        "test_category": "Engineering Draft Question",
        "question_prompt": "Stakeholder write test",
        "actual_ai_answer": "Should be blocked",
    }
    resp = client.post("/api/test-cases", json=payload, headers=auth_headers(token))
    assert resp.status_code == 403

def test_create_test_case_admin_allowed():
    """Admin should be able to create a test case."""
    token = get_admin_token()
    payload = {
        "case_id": "TC-RBAC-ADMIN-001",
        "test_category": "Engineering Draft Question",
        "question_prompt": "Admin RBAC write test",
        "test_type": "Accuracy",
        "actual_ai_answer": "Should succeed",
    }
    resp = client.post("/api/test-cases", json=payload, headers=auth_headers(token))
    assert resp.status_code in [200, 400]  # 400 means already exists from prior run -- also fine

def test_nominate_reviewer_stakeholder_forbidden():
    token = get_token_for_role("stakeholder")
    payload = {
        "reviewer_id": "RBAC-STAKEHOLDER-REV",
        "full_name": "Forbidden Reviewer",
        "reviewer_type": "Technical / AI Evaluation Reviewer",
        "email": "forbidden@test.org",
        "professional_profile": "Should not be created",
    }
    resp = client.post("/api/reviewers", json=payload, headers=auth_headers(token))
    assert resp.status_code == 403

def test_nominate_reviewer_coordinator_allowed():
    token = get_token_for_role("pilot_coordinator")
    payload = {
        "reviewer_id": "RBAC-COORD-REV-001",
        "full_name": "Coordinator-Nominated Reviewer",
        "reviewer_type": "Technical / AI Evaluation Reviewer",
        "email": "coordrev@test.org",
        "professional_profile": "Senior AI Engineer, FastAPI + PostgreSQL",
    }
    resp = client.post("/api/reviewers", json=payload, headers=auth_headers(token))
    assert resp.status_code in [200, 400]

def test_verify_reviewer_technical_reviewer_forbidden():
    """A technical_reviewer must NOT be able to approve other reviewers."""
    token = get_token_for_role("technical_reviewer")
    reviewers = client.get("/api/reviewers").json()
    if not reviewers:
        pytest.skip("No reviewers seeded")
    rev_id = reviewers[0]["id"]
    resp = client.put(f"/api/reviewers/{rev_id}/verify", json={
        "verification_status": "Approved",
        "qualification_verified": True,
        "independence_verified": True,
    }, headers=auth_headers(token))
    assert resp.status_code == 403

def test_verify_reviewer_admin_allowed():
    token = get_admin_token()
    reviewers = client.get("/api/reviewers").json()
    if not reviewers:
        pytest.skip("No reviewers seeded")
    rev_id = reviewers[0]["id"]
    resp = client.put(f"/api/reviewers/{rev_id}/verify", json={
        "verification_status": "Approved",
        "qualification_verified": True,
        "qualification_notes": "RBAC test verified",
        "independence_verified": True,
        "independence_notes": "Zero COI confirmed",
    }, headers=auth_headers(token))
    assert resp.status_code == 200
    assert resp.json()["qualification_verified"] is True

def test_submit_judgment_requires_auth():
    resp = client.post("/api/judgments", json={
        "case_id": 1,
        "reviewer_id": 1,
        "accuracy_score": "Meets criteria",
        "citation_score": "Meets criteria",
        "retrieval_score": "Meets criteria",
        "privacy_score": "Meets criteria",
        "safety_score": "Meets criteria",
        "overall_verdict": "Pass",
        "rationale": "Anon test",
    })
    assert resp.status_code == 401

def test_sign_off_requires_admin():
    """Only admin role may trigger pilot sign-off."""
    token = get_token_for_role("pilot_coordinator")
    resp = client.post("/api/pilot/sign-off", json={
        "signed_off_by": "Coordinator trying to sign off",
        "sign_off_notes": "Should be blocked"
    }, headers=auth_headers(token))
    assert resp.status_code == 403

def test_sign_off_stop_gate_blocks_even_admin():
    """Even admin cannot sign off while Critical findings remain open."""
    token = get_admin_token()
    resp = client.post("/api/pilot/sign-off", json={
        "signed_off_by": "Admin",
        "sign_off_notes": "Attempting sign-off without resolving critical safety issues"
    }, headers=auth_headers(token))
    assert resp.status_code == 400
    assert "BLOCKED by critical findings gate" in resp.json()["detail"]


# -----------------------------------------------------------------------------
# 5. Bulk CSV import
# -----------------------------------------------------------------------------

def _make_csv(rows: list) -> bytes:
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue().encode("utf-8")

def test_csv_import_requires_auth():
    csv_data = _make_csv([{
        "case_id": "TC-CSV-ANON",
        "test_category": "Engineering Draft Question",
        "question_prompt": "Anon import test",
        "actual_ai_answer": "Blocked"
    }])
    resp = client.post(
        "/api/test-cases/import/csv",
        files={"file": ("cases.csv", io.BytesIO(csv_data), "text/csv")},
    )
    assert resp.status_code == 401

def test_csv_import_rejects_non_csv():
    token = get_admin_token()
    resp = client.post(
        "/api/test-cases/import/csv",
        files={"file": ("cases.json", io.BytesIO(b"{invalid}"), "application/json")},
        headers=auth_headers(token)
    )
    assert resp.status_code == 400
    assert "Only .csv files" in resp.json()["detail"]

def test_csv_import_rejects_missing_columns():
    token = get_admin_token()
    bad_csv = b"col_a,col_b\nval1,val2\n"
    resp = client.post(
        "/api/test-cases/import/csv",
        files={"file": ("cases.csv", io.BytesIO(bad_csv), "text/csv")},
        headers=auth_headers(token)
    )
    assert resp.status_code == 422
    assert "CSV must contain columns" in resp.json()["detail"]

def test_csv_import_valid_file():
    token = get_admin_token()
    rows = [
        {
            "case_id": "TC-CSV-IMPORT-AUTO-001",
            "test_category": "Natural Language Question",
            "question_prompt": "How do I reset Voltas 1.5T AC to factory default?",
            "actual_ai_answer": "Press and hold Mode + Fan for 5 seconds.",
            "brand": "Voltas",
            "product_category": "Air Conditioners",
            "safety_sensitivity": "Low",
            "held_out_flag": "false",
        },
        {
            "case_id": "TC-CSV-IMPORT-AUTO-002",
            "test_category": "Held-Out Case",
            "question_prompt": "Is it safe to recharge R32 refrigerant at home without a technician?",
            "actual_ai_answer": "No, R32 is flammable (A2L). Only licensed technicians should handle it.",
            "brand": "Daikin India",
            "product_category": "Air Conditioners",
            "safety_sensitivity": "Critical",
            "held_out_flag": "true",
        },
    ]
    csv_data = _make_csv(rows)
    resp = client.post(
        "/api/test-cases/import/csv",
        files={"file": ("cases.csv", io.BytesIO(csv_data), "text/csv")},
        headers=auth_headers(token)
    )
    data = resp.json()
    assert resp.status_code == 200
    assert data["imported"] + data["skipped_duplicates"] == 2  # total rows processed
    assert data["errors"] == []

def test_csv_import_skips_duplicates():
    token = get_admin_token()
    # Re-submit the same IDs from the previous test -- they should be skipped
    rows = [{
        "case_id": "TC-CSV-IMPORT-AUTO-001",
        "test_category": "Natural Language Question",
        "question_prompt": "Duplicate test",
        "actual_ai_answer": "Duplicate answer",
    }]
    csv_data = _make_csv(rows)
    resp = client.post(
        "/api/test-cases/import/csv",
        files={"file": ("cases.csv", io.BytesIO(csv_data), "text/csv")},
        headers=auth_headers(token)
    )
    data = resp.json()
    assert resp.status_code == 200
    assert data["imported"] == 0
    assert data["skipped_duplicates"] == 1
    assert "TC-CSV-IMPORT-AUTO-001" in data["skipped_ids"]


# -----------------------------------------------------------------------------
# 6. Core existing tests (preserved)
# -----------------------------------------------------------------------------

def test_get_test_cases():
    response = client.get("/api/test-cases")
    assert response.status_code == 200
    cases = response.json()
    assert len(cases) >= 8

def test_filter_test_cases_by_brand():
    response = client.get("/api/test-cases?brand=Voltas")
    assert response.status_code == 200
    cases = response.json()
    assert len(cases) >= 1
    for c in cases:
        assert "voltas" in c["brand"].lower()

def test_get_reviewers_two_types():
    response = client.get("/api/reviewers")
    assert response.status_code == 200
    reviewers = response.json()
    assert len(reviewers) >= 4
    tech   = [r for r in reviewers if "Technical" in r["reviewer_type"]]
    domain = [r for r in reviewers if "Domain"    in r["reviewer_type"]]
    assert len(tech)   >= 1, "Need at least 1 Technical reviewer"
    assert len(domain) >= 1, "Need at least 1 Domain reviewer"

def test_get_disagreements():
    response = client.get("/api/disagreements")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_findings_has_critical():
    response = client.get("/api/findings")
    assert response.status_code == 200
    findings = response.json()
    assert len(findings) >= 1
    critical = [f for f in findings if f["severity"] == "Critical"]
    assert len(critical) >= 1

def test_dashboard_analytics_benchmark():
    response = client.get("/api/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert data["flowchart_benchmark"]["total_cases"]   == 264
    assert data["flowchart_benchmark"]["quality_score"] == 82
    assert data["flowchart_benchmark"]["pass_count"]    == 198

def test_export_scorecard_pdf():
    response = client.get("/api/reports/pdf/scorecard")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 1000

def test_export_safety_privacy_pdf():
    response = client.get("/api/reports/pdf/safety-privacy")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 1000

