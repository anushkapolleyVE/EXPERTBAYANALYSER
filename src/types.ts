export type UserRole = 
  | 'admin'
  | 'tech_reviewer'
  | 'domain_reviewer_1'
  | 'domain_reviewer_2'
  | 'adjudicator';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  roleLabel: string;
  reviewerId?: string;
  email: string;
}

export interface PilotData {
  id: number;
  pilot_code: string;
  name: string;
  description: string;
  status: string;
  initial_eng_questions_count: number;
  initial_retrieval_probes_count: number;
  total_starting_materials: number;
}

export interface RetrievedDoc {
  doc_id: string;
  title: string;
  snippet: string;
  is_authoritative?: boolean;
}

export interface LanguageCoverageItem {
  language: string;
  proficiency: string;
  reading: boolean;
  technical_docs: boolean;
  eval_capability: boolean;
}

export interface IndiaMarketCoverage {
  regions: string[];
  regulatory_standards: string;
}

export interface CoiDetails {
  previous_implementation_involvement: boolean;
  answer_authorship_involvement: boolean;
  employment_relationships: string;
  financial_interests: string;
  vendor_relationships: string;
  disclosure_date: string;
  mitigation_decision: string;
}

export interface TestCase {
  id: number;
  case_id: string;
  test_category: string;
  question_prompt: string;
  test_type: string;
  expected_answer?: string;
  actual_ai_answer: string;
  retrieved_documents?: string;
  reference_sources?: string;
  source_url?: string;
  product_category?: string;
  brand?: string;
  model_number?: string;
  market_region?: string;
  language?: string;
  safety_sensitivity: 'Low' | 'Medium' | 'High' | 'Critical';
  privacy_sensitivity: 'Low' | 'Medium' | 'High' | 'Critical';
  evaluation_status: 'Unreviewed Starting Material' | 'Awaiting Review' | 'In Progress' | 'Reviewed' | 'Disagreement' | 'Adjudicated' | 'Excluded' | 'Critical Failure' | string;
  held_out_flag: boolean;
  test_set_designation: string;
  is_excluded: boolean;
  exclusion_reason?: string;
  notes?: string;
  version: number;
  created_at?: string;
  updated_at?: string;
}

export interface Reviewer {
  id: number;
  reviewer_id: string;
  full_name: string;
  reviewer_type: 'Technical / AI Evaluation Reviewer' | 'Home-Service Domain Reviewer';
  email: string;
  professional_profile: string;
  work_experience: string;
  technical_skills?: string;
  years_experience: number;
  credentials: string;
  evaluation_experience: string;
  relevant_project_experience: string;
  product_categories?: string;
  brands_covered?: string;
  models_covered?: string;
  language_coverage?: string;
  india_market_coverage?: string;
  official_guidance_familiarity?: 'High' | 'Moderate' | 'Basic';
  regulator_guidance_familiarity?: 'High' | 'Moderate' | 'Basic';
  availability_status: 'Available' | 'Assigned' | 'Capacity Reached' | 'Inactive';
  hourly_rate: string;
  verification_status: 'Nominated' | 'Under Review' | 'Verification Pending' | 'Verified' | 'Shortlisted' | 'Approved' | 'Rejected' | string;
  qualification_verified: boolean;
  qualification_notes?: string;
  qualification_evidence?: string;
  independence_verified: boolean;
  independence_notes?: string;
  conflict_of_interest_disclosed: boolean;
  coi_has_disqualifying_conflict: boolean;
  coi_details?: string;
  coi_mitigation_decision?: string;
}

export interface Assignment {
  id: number;
  assignment_id: string;
  case_id: number;
  case_code?: string;
  case_prompt?: string;
  category?: string;
  reviewer_id: number;
  reviewer_name?: string;
  reviewer_code?: string;
  reviewer_type?: string;
  assigned_role: string;
  status: 'Assigned' | 'Accepted' | 'In Progress' | 'Completed' | 'Reassigned' | 'Overdue';
  deadline: string;
  reassignment_reason?: string;
}

export type ScoreRating = 
  | 'Meets criteria'
  | 'Partially meets criteria'
  | 'Does not meet criteria'
  | 'Unable to assess'
  | 'Not applicable';

export type OverallVerdict = 
  | 'Pass'
  | 'Issue'
  | 'Critical Failure'
  | 'Unable to Assess';

export interface Judgment {
  id: number;
  judgment_id: string;
  case_id: number;
  reviewer_id: number;
  is_draft: boolean;
  accuracy_score: ScoreRating;
  citation_score: ScoreRating;
  retrieval_score: ScoreRating;
  privacy_score: ScoreRating;
  safety_score: ScoreRating;
  overall_verdict: OverallVerdict;
  severity: 'None' | 'Low' | 'Medium' | 'High' | 'Critical';
  failure_category: string;
  rationale: string;
  evidence_notes?: string;
  citation_links_verified: boolean;
  rubric_version: string;
  is_locked: boolean;
  amendment_version: number;
  amendment_reason?: string;
  submitted_at: string;
}

export interface Disagreement {
  id: number;
  disagreement_id: string;
  case_id: number;
  case_code: string;
  case_prompt: string;
  category: string;
  reviewer_a_id: number;
  reviewer_b_id: number;
  conflicting_dimensions: string[];
  conflicting_verdicts: {
    reviewer_a: { name: string; verdict: string; severity?: string; dimension?: string };
    reviewer_b: { name: string; verdict: string; severity?: string; dimension?: string };
  };
  status: 'Pending Adjudication' | 'In Review' | 'Resolved';
  adjudicator_id?: number;
  final_resolution_verdict?: string;
  adjudication_rationale?: string;
  resolved_at?: string;
  created_at?: string;
}

export interface Finding {
  id: number;
  finding_id: string;
  case_id: number;
  case_code: string;
  category: 'Safety Failure' | 'Privacy Risk' | 'Hallucination' | 'Incorrect Citation' | 'Retrieval Failure' | 'Factual Inaccuracy';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  evidence: string;
  reviewer_id?: number;
  impact?: string;
  reproducibility: 'Always' | 'Intermittent' | 'Edge Case';
  status: 'Open' | 'In Remediation' | 'Resolved' | 'Verified Closed';
  remediation_recommendation?: string;
  blocks_pilot_signoff: boolean;
  created_at?: string;
}

export interface Recommendation {
  id: number;
  rec_id: string;
  improvement_area: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  evidence: string;
  recommended_action: string;
  responsible_role: string;
  suggested_next_step?: string;
  status: 'Open' | 'Planned' | 'In Progress' | 'Implemented';
}

export interface AuditLogItem {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
}
