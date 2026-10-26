import { 
  TestCase, Reviewer, Assignment, Judgment, Disagreement, Finding, 
  Recommendation, AuditLogItem 
} from '../types';
import { 
  INITIAL_TEST_CASES, INITIAL_REVIEWERS, INITIAL_ASSIGNMENTS, 
  INITIAL_JUDGMENTS, INITIAL_DISAGREEMENTS, INITIAL_FINDINGS, 
  INITIAL_RECOMMENDATIONS, INITIAL_AUDIT_LOGS, INITIAL_PILOT_INFO 
} from '../mockData';

// Dynamic API base URL: Uses VITE_API_BASE_URL if set (production deployment), or Vite dev proxy (/api)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const TIMEOUT_MS = 15000; // 15s to allow for serverless PostgreSQL cold-starts

// Helper for local storage persistence cache
function getLocal<T>(key: string, initial: T): T {
  try {
    const item = localStorage.getItem(`expertbay_${key}`);
    return item ? JSON.parse(item) : initial;
  } catch (e) {
    return initial;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`expertbay_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage error:', e);
  }
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem('expertbay_jwt_token');
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('expertbay_jwt_token', token);
  } else {
    localStorage.removeItem('expertbay_jwt_token');
  }
};

const getHeaders = (extraHeaders: Record<string, string> = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Authentication
  login: async (email: string, role?: string, password: string = 'demo'): Promise<string> => {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          setAuthToken(data.access_token);
          return data.access_token;
        }
      }
    } catch (e) {
      console.warn('API login unreachable, proceeding in demo session mode:', e);
    }
    return '';
  },

  // Pilot Info
  getPilotInfo: async () => {
    try {
      const res = await fetch(`${BASE_URL}/pilots/current`, { 
        headers: getHeaders(),
        signal: AbortSignal.timeout(TIMEOUT_MS) 
      });
      if (res.ok) {
        const data = await res.json();
        setLocal('pilot_info', data);
        return data;
      }
    } catch (e) {
      console.warn('Failed to fetch pilot info from API, using cached data:', e);
    }
    return getLocal('pilot_info', INITIAL_PILOT_INFO);
  },

  // Test Cases
  getTestCases: async (filters?: { category?: string; brand?: string; language?: string; status?: string; held_out?: boolean; search?: string }): Promise<TestCase[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.brand) params.append('brand', filters.brand);
      if (filters?.language) params.append('language', filters.language);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.held_out !== undefined) params.append('held_out', String(filters.held_out));
      if (filters?.search) params.append('search', filters.search);

      const res = await fetch(`${BASE_URL}/test-cases?${params.toString()}`, { 
        headers: getHeaders(),
        signal: AbortSignal.timeout(TIMEOUT_MS) 
      });
      if (res.ok) {
        const data = await res.json();
        setLocal('test_cases', data);
        return data;
      }
    } catch (e) {
      console.warn('Failed to fetch test cases from API, using cached data:', e);
    }

    let cases = getLocal('test_cases', INITIAL_TEST_CASES);
    if (filters?.category) cases = cases.filter(c => c.test_category === filters.category);
    if (filters?.brand) cases = cases.filter(c => c.brand?.toLowerCase().includes(filters.brand!.toLowerCase()));
    if (filters?.language) cases = cases.filter(c => c.language === filters.language);
    if (filters?.status) cases = cases.filter(c => c.evaluation_status === filters.status);
    if (filters?.held_out !== undefined) cases = cases.filter(c => c.held_out_flag === filters.held_out);
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      cases = cases.filter(c => 
        c.case_id.toLowerCase().includes(s) || 
        c.question_prompt.toLowerCase().includes(s) || 
        c.brand?.toLowerCase().includes(s) || 
        c.product_category?.toLowerCase().includes(s)
      );
    }
    return cases;
  },

  createTestCase: async (newCase: Partial<TestCase>): Promise<TestCase> => {
    try {
      const res = await fetch(`${BASE_URL}/test-cases`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newCase),
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      if (res.ok) {
        const data = await res.json();
        const cases = getLocal('test_cases', INITIAL_TEST_CASES);
        setLocal('test_cases', [data, ...cases]);
        return data;
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch')) {
        throw e;
      }
      console.warn('Backend API unreachable, creating test case locally:', e);
    }

    const cases = getLocal('test_cases', INITIAL_TEST_CASES);
    const created: TestCase = {
      id: cases.length + 1,
      case_id: newCase.case_id || `TC-NEW-${Date.now().toString().slice(-4)}`,
      test_category: newCase.test_category || 'Engineering Draft Question',
      question_prompt: newCase.question_prompt || '',
      test_type: newCase.test_type || 'Accuracy',
      expected_answer: newCase.expected_answer,
      actual_ai_answer: newCase.actual_ai_answer || '',
      retrieved_documents: newCase.retrieved_documents,
      reference_sources: newCase.reference_sources,
      source_url: newCase.source_url,
      product_category: newCase.product_category,
      brand: newCase.brand,
      model_number: newCase.model_number,
      market_region: newCase.market_region || 'India',
      language: newCase.language || 'English',
      safety_sensitivity: newCase.safety_sensitivity || 'Low',
      privacy_sensitivity: newCase.privacy_sensitivity || 'Low',
      evaluation_status: 'Awaiting Review',
      held_out_flag: !!newCase.held_out_flag,
      test_set_designation: newCase.test_set_designation || 'Additional Evaluated Case',
      is_excluded: false,
      notes: newCase.notes,
      version: 1
    };
    cases.unshift(created);
    setLocal('test_cases', cases);
    return created;
  },

  updateTestCase: async (caseId: string | number, updates: Partial<TestCase>): Promise<TestCase> => {
    try {
      const res = await fetch(`${BASE_URL}/test-cases/${caseId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates),
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      if (res.ok) {
        const data = await res.json();
        const cases = getLocal('test_cases', INITIAL_TEST_CASES);
        const idx = cases.findIndex(c => c.id === caseId || c.case_id === caseId);
        if (idx !== -1) {
          cases[idx] = data;
          setLocal('test_cases', cases);
        }
        return data;
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch')) {
        throw e;
      }
      console.warn('Backend API unreachable, updating test case locally:', e);
    }

    const cases = getLocal('test_cases', INITIAL_TEST_CASES);
    const idx = cases.findIndex(c => c.id === caseId || c.case_id === caseId);
    if (idx !== -1) {
      cases[idx] = { ...cases[idx], ...updates, version: (cases[idx].version || 1) + 1 };
      setLocal('test_cases', cases);
      return cases[idx];
    }
    throw new Error('Case not found');
  },

  // Reviewers
  getReviewers: async (type?: string): Promise<Reviewer[]> => {
    try {
      const url = type ? `${BASE_URL}/reviewers?reviewer_type=${encodeURIComponent(type)}` : `${BASE_URL}/reviewers`;
      const res = await fetch(url, { 
        headers: getHeaders(),
        signal: AbortSignal.timeout(TIMEOUT_MS) 
      });
      if (res.ok) {
        const data = await res.json();
        setLocal('reviewers', data);
        return data;
      }
    } catch (e) {
      console.warn('Failed to fetch reviewers from API, using cached data:', e);
    }

    let reviewers = getLocal('reviewers', INITIAL_REVIEWERS);
    if (type) {
      reviewers = reviewers.filter(r => r.reviewer_type === type);
    }
    return reviewers;
  },

  nominateReviewer: async (reviewer: Partial<Reviewer>): Promise<Reviewer> => {
    try {
      const res = await fetch(`${BASE_URL}/reviewers`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(reviewer),
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      if (res.ok) {
        const data = await res.json();
        const reviewers = getLocal('reviewers', INITIAL_REVIEWERS);
        reviewers.push(data);
        setLocal('reviewers', reviewers);
        return data;
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch')) {
        throw e;
      }
      console.warn('Backend API unreachable, nominating reviewer locally:', e);
    }

    const reviewers = getLocal('reviewers', INITIAL_REVIEWERS);
    const created: Reviewer = {
      id: reviewers.length + 1,
      reviewer_id: reviewer.reviewer_id || `DEMO-${Date.now().toString().slice(-4)}`,
      full_name: reviewer.full_name || 'Nominated Candidate',
      reviewer_type: reviewer.reviewer_type || 'Home-Service Domain Reviewer',
      email: reviewer.email || 'candidate@demo.org',
      professional_profile: reviewer.professional_profile || '',
      work_experience: reviewer.work_experience || '',
      technical_skills: reviewer.technical_skills,
      years_experience: reviewer.years_experience || 5,
      credentials: reviewer.credentials || 'Certified Professional',
      evaluation_experience: reviewer.evaluation_experience || '',
      relevant_project_experience: reviewer.relevant_project_experience || '',
      product_categories: reviewer.product_categories,
      brands_covered: reviewer.brands_covered,
      models_covered: reviewer.models_covered,
      language_coverage: reviewer.language_coverage,
      india_market_coverage: reviewer.india_market_coverage,
      official_guidance_familiarity: reviewer.official_guidance_familiarity || 'Moderate',
      regulator_guidance_familiarity: reviewer.regulator_guidance_familiarity || 'Moderate',
      availability_status: 'Available',
      hourly_rate: reviewer.hourly_rate || '$60/hr',
      verification_status: 'Nominated',
      qualification_verified: false,
      qualification_notes: 'Under review by credentials verification committee',
      independence_verified: false,
      independence_notes: 'Independence audit pending',
      conflict_of_interest_disclosed: true,
      coi_has_disqualifying_conflict: false,
      coi_details: JSON.stringify({
        previous_implementation_involvement: false,
        answer_authorship_involvement: false,
        disclosure_date: new Date().toISOString().slice(0, 10),
        mitigation_decision: 'Pending Review'
      }),
      coi_mitigation_decision: 'Nominated - Verification Pending'
    };
    reviewers.push(created);
    setLocal('reviewers', reviewers);
    return created;
  },

  verifyReviewer: async (reviewerId: string | number, verifyData: {
    verification_status?: string;
    qualification_verified?: boolean;
    qualification_notes?: string;
    independence_verified?: boolean;
    independence_notes?: string;
    coi_mitigation_decision?: string;
  }): Promise<Reviewer> => {
    try {
      const res = await fetch(`${BASE_URL}/reviewers/${reviewerId}/verify`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(verifyData),
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      if (res.ok) {
        const data = await res.json();
        const reviewers = getLocal('reviewers', INITIAL_REVIEWERS);
        const idx = reviewers.findIndex(r => r.id === reviewerId || r.reviewer_id === reviewerId);
        if (idx !== -1) {
          reviewers[idx] = data;
          setLocal('reviewers', reviewers);
        }
        return data;
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch')) {
        throw e;
      }
      console.warn('Backend API unreachable, verifying reviewer locally:', e);
    }

    const reviewers = getLocal('reviewers', INITIAL_REVIEWERS);
    const idx = reviewers.findIndex(r => r.id === reviewerId || r.reviewer_id === reviewerId);
    if (idx !== -1) {
      reviewers[idx] = { ...reviewers[idx], ...verifyData };
      setLocal('reviewers', reviewers);
      return reviewers[idx];
    }
    throw new Error('Reviewer not found');
  },

  // Assignments
  getAssignments: async (): Promise<Assignment[]> => {
    try {
      const res = await fetch(`${BASE_URL}/assignments`, { 
        headers: getHeaders(),
        signal: AbortSignal.timeout(TIMEOUT_MS) 
      });
      if (res.ok) {
        const data = await res.json();
        setLocal('assignments', data);
        return data;
      }
    } catch (e) {
      console.warn('Failed to fetch assignments from API, using cached data:', e);
    }
    return getLocal('assignments', INITIAL_ASSIGNMENTS);
  },

  createAssignment: async (payload: { case_id: number; reviewer_id: number; assigned_role?: string; deadline?: string }) => {
    try {
      const res = await fetch(`${BASE_URL}/assignments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      if (res.ok) {
        const data = await res.json();
        const asgns = getLocal('assignments', INITIAL_ASSIGNMENTS);
        asgns.push(data);
        setLocal('assignments', asgns);
        return data;
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch')) {
        throw e;
      }
      console.warn('Backend API unreachable, creating assignment locally:', e);
    }

    const asgns = getLocal('assignments', INITIAL_ASSIGNMENTS);
    const newAsgn: Assignment = {
      id: asgns.length + 1,
      assignment_id: `ASGN-${Date.now().toString().slice(-4)}`,
      case_id: payload.case_id,
      reviewer_id: payload.reviewer_id,
      assigned_role: payload.assigned_role || 'Secondary Reviewer',
      status: 'Assigned',
      deadline: payload.deadline || '2026-03-25'
    };
    asgns.push(newAsgn);
    setLocal('assignments', asgns);
    return newAsgn;
  },

  // Judgments
  getJudgments: async (caseId?: number): Promise<Judgment[]> => {
    try {
      const url = caseId ? `${BASE_URL}/judgments?case_id=${caseId}` : `${BASE_URL}/judgments`;
      const res = await fetch(url, { 
        headers: getHeaders(),
        signal: AbortSignal.timeout(TIMEOUT_MS) 
      });
      if (res.ok) {
        const data = await res.json();
        setLocal('judgments', data);
        return data;
      }
    } catch (e) {
      console.warn('Failed to fetch judgments from API, using cached data:', e);
    }

    const judgments = getLocal('judgments', INITIAL_JUDGMENTS);
    if (caseId) return judgments.filter(j => j.case_id === caseId);
    return judgments;
  },

  submitJudgment: async (judgmentData: Partial<Judgment>): Promise<Judgment> => {
    try {
      const res = await fetch(`${BASE_URL}/judgments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(judgmentData),
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      if (res.ok) {
        const data = await res.json();
        const judgments = getLocal('judgments', INITIAL_JUDGMENTS);
        judgments.push(data);
        setLocal('judgments', judgments);
        return data;
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch')) {
        throw e;
      }
      console.warn('Backend API unreachable, submitting judgment locally:', e);
    }

    const judgments = getLocal('judgments', INITIAL_JUDGMENTS);
    const cases = getLocal('test_cases', INITIAL_TEST_CASES);
    const caseObj = cases.find(c => c.id === judgmentData.case_id);

    const newJdg: Judgment = {
      id: judgments.length + 1,
      judgment_id: `JDG-${caseObj?.case_id || 'TC'}-${judgmentData.reviewer_id || 1}`,
      case_id: judgmentData.case_id!,
      reviewer_id: judgmentData.reviewer_id!,
      is_draft: !!judgmentData.is_draft,
      accuracy_score: judgmentData.accuracy_score || 'Meets criteria',
      citation_score: judgmentData.citation_score || 'Meets criteria',
      retrieval_score: judgmentData.retrieval_score || 'Meets criteria',
      privacy_score: judgmentData.privacy_score || 'Meets criteria',
      safety_score: judgmentData.safety_score || 'Meets criteria',
      overall_verdict: judgmentData.overall_verdict || 'Pass',
      severity: judgmentData.severity || 'None',
      failure_category: judgmentData.failure_category || 'None',
      rationale: judgmentData.rationale || '',
      evidence_notes: judgmentData.evidence_notes,
      citation_links_verified: true,
      rubric_version: 'v1.2-standard',
      is_locked: !judgmentData.is_draft,
      amendment_version: 1,
      submitted_at: new Date().toISOString()
    };

    judgments.push(newJdg);
    setLocal('judgments', judgments);

    if (caseObj) {
      const otherJudgments = judgments.filter(j => j.case_id === caseObj.id && j.id !== newJdg.id && !j.is_draft);
      if (otherJudgments.length > 0 && !newJdg.is_draft) {
        const other = otherJudgments[0];
        if (other.overall_verdict !== newJdg.overall_verdict) {
          caseObj.evaluation_status = 'Disagreement';
          const disags = getLocal('disagreements', INITIAL_DISAGREEMENTS);
          disags.push({
            id: disags.length + 1,
            disagreement_id: `DISAG-${caseObj.case_id}-${Date.now().toString().slice(-4)}`,
            case_id: caseObj.id,
            case_code: caseObj.case_id,
            case_prompt: caseObj.question_prompt,
            category: newJdg.safety_score === 'Does not meet criteria' ? 'Safety' : 'Citation validity',
            reviewer_a_id: other.reviewer_id,
            reviewer_b_id: newJdg.reviewer_id,
            conflicting_dimensions: ['overall_verdict'],
            conflicting_verdicts: {
              reviewer_a: { name: `Reviewer #${other.reviewer_id}`, verdict: other.overall_verdict, severity: other.severity },
              reviewer_b: { name: `Reviewer #${newJdg.reviewer_id}`, verdict: newJdg.overall_verdict, severity: newJdg.severity }
            },
            status: 'Pending Adjudication',
            created_at: new Date().toISOString()
          });
          setLocal('disagreements', disags);
        } else {
          caseObj.evaluation_status = 'Reviewed';
        }
      } else if (!newJdg.is_draft) {
        caseObj.evaluation_status = 'In Progress';
      }
      setLocal('test_cases', cases);
    }

    return newJdg;
  },

  // Disagreements
  getDisagreements: async (): Promise<Disagreement[]> => {
    try {
      const res = await fetch(`${BASE_URL}/disagreements`, { 
        headers: getHeaders(),
        signal: AbortSignal.timeout(TIMEOUT_MS) 
      });
      if (res.ok) {
        const data = await res.json();
        setLocal('disagreements', data);
        return data;
      }
    } catch (e) {
      console.warn('Failed to fetch disagreements from API, using cached data:', e);
    }
    return getLocal('disagreements', INITIAL_DISAGREEMENTS);
  },

  resolveDisagreement: async (disagId: string | number, payload: {
    final_resolution_verdict: string;
    adjudication_rationale: string;
    adjudicator_id: number;
  }) => {
    try {
      const res = await fetch(`${BASE_URL}/disagreements/${disagId}/resolve`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      if (res.ok) {
        const data = await res.json();
        const disags = getLocal('disagreements', INITIAL_DISAGREEMENTS);
        const idx = disags.findIndex(d => d.id === disagId || d.disagreement_id === disagId);
        if (idx !== -1) {
          disags[idx].status = 'Resolved';
          disags[idx].final_resolution_verdict = payload.final_resolution_verdict;
          disags[idx].adjudication_rationale = payload.adjudication_rationale;
          setLocal('disagreements', disags);
        }
        return data;
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch')) {
        throw e;
      }
      console.warn('Backend API unreachable, resolving disagreement locally:', e);
    }

    const disags = getLocal('disagreements', INITIAL_DISAGREEMENTS);
    const idx = disags.findIndex(d => d.id === disagId || d.disagreement_id === disagId);
    if (idx !== -1) {
      disags[idx] = {
        ...disags[idx],
        status: 'Resolved',
        final_resolution_verdict: payload.final_resolution_verdict,
        adjudication_rationale: payload.adjudication_rationale,
        adjudicator_id: payload.adjudicator_id,
        resolved_at: new Date().toISOString()
      };
      setLocal('disagreements', disags);

      const cases = getLocal('test_cases', INITIAL_TEST_CASES);
      const caseIdx = cases.findIndex(c => c.id === disags[idx].case_id);
      if (caseIdx !== -1) {
        cases[caseIdx].evaluation_status = 'Adjudicated';
        setLocal('test_cases', cases);
      }
      return { message: 'Disagreement resolved' };
    }
    throw new Error('Disagreement not found');
  },

  // Findings
  getFindings: async (): Promise<Finding[]> => {
    try {
      const res = await fetch(`${BASE_URL}/findings`, { 
        headers: getHeaders(),
        signal: AbortSignal.timeout(TIMEOUT_MS) 
      });
      if (res.ok) {
        const data = await res.json();
        setLocal('findings', data);
        return data;
      }
    } catch (e) {
      console.warn('Failed to fetch findings from API, using cached data:', e);
    }
    return getLocal('findings', INITIAL_FINDINGS);
  },

  updateFinding: async (findingId: string | number, updates: Partial<Finding>): Promise<Finding> => {
    try {
      const res = await fetch(`${BASE_URL}/findings/${findingId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates),
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      if (res.ok) {
        const data = await res.json();
        const findings = getLocal('findings', INITIAL_FINDINGS);
        const idx = findings.findIndex(f => f.id === findingId || f.finding_id === findingId);
        if (idx !== -1) {
          findings[idx] = data;
          setLocal('findings', findings);
        }
        return data;
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch')) {
        throw e;
      }
      console.warn('Backend API unreachable, updating finding locally:', e);
    }

    const findings = getLocal('findings', INITIAL_FINDINGS);
    const idx = findings.findIndex(f => f.id === findingId || f.finding_id === findingId);
    if (idx !== -1) {
      findings[idx] = { ...findings[idx], ...updates };
      setLocal('findings', findings);
      return findings[idx];
    }
    throw new Error('Finding not found');
  },

  // Recommendations & Audit Logs
  getRecommendations: async (): Promise<Recommendation[]> => {
    try {
      const res = await fetch(`${BASE_URL}/recommendations`, { 
        headers: getHeaders(),
        signal: AbortSignal.timeout(TIMEOUT_MS) 
      });
      if (res.ok) {
        const data = await res.json();
        setLocal('recommendations', data);
        return data;
      }
    } catch (e) {
      console.warn('Failed to fetch recommendations from API, using cached data:', e);
    }
    return getLocal('recommendations', INITIAL_RECOMMENDATIONS);
  },

  getAuditLogs: async (): Promise<AuditLogItem[]> => {
    try {
      const res = await fetch(`${BASE_URL}/audit-logs`, { 
        headers: getHeaders(),
        signal: AbortSignal.timeout(TIMEOUT_MS) 
      });
      if (res.ok) {
        const data = await res.json();
        setLocal('audit_logs', data);
        return data;
      }
    } catch (e) {
      console.warn('Failed to fetch audit logs from API, using cached data:', e);
    }
    return getLocal('audit_logs', INITIAL_AUDIT_LOGS);
  },

  // Dashboard Analytics
  getDashboardAnalytics: async () => {
    try {
      const res = await fetch(`${BASE_URL}/analytics/dashboard`, { 
        headers: getHeaders(),
        signal: AbortSignal.timeout(TIMEOUT_MS) 
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Failed to fetch dashboard analytics from API:', e);
    }
    return null;
  }
};
