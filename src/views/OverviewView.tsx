import React from 'react';
import { 
  CheckCircle2, AlertTriangle, AlertOctagon, ShieldCheck, 
  Users, GitCompare, ArrowRight, Info, 
  ChevronRight, Database, UserCheck
} from 'lucide-react';
import { TestCase, Reviewer, Assignment, Judgment, Disagreement, Finding, Recommendation, AuditLogItem } from '../types';
import { NavItem } from '../components/Sidebar';

interface OverviewViewProps {
  testCases: TestCase[];
  reviewers: Reviewer[];
  assignments: Assignment[];
  judgments: Judgment[];
  disagreements: Disagreement[];
  findings: Finding[];
  recommendations: Recommendation[];
  auditLogs: AuditLogItem[];
  onNavigate: (tab: NavItem) => void;
  onOpenFlowchart?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  testCases,
  reviewers,
  assignments,
  judgments,
  disagreements,
  findings,
  recommendations,
  auditLogs,
  onNavigate
}) => {
  // Live dynamic calculations from active demo dataset
  const liveReviewedCases = testCases.filter(c => c.evaluation_status === 'Reviewed' || c.evaluation_status === 'Adjudicated');
  const livePendingCases = testCases.filter(c => c.evaluation_status === 'Awaiting Review' || c.evaluation_status === 'In Progress');
  
  const livePass = judgments.filter(j => j.overall_verdict === 'Pass' && !j.is_draft).length;
  const liveIssues = judgments.filter(j => j.overall_verdict === 'Issue' && !j.is_draft).length;
  const liveCritical = judgments.filter(j => j.overall_verdict === 'Critical Failure' && !j.is_draft).length;
  const livePrivacyFailures = judgments.filter(j => j.privacy_score === 'Does not meet criteria' && !j.is_draft).length;

  const totalJudgments = judgments.filter(j => !j.is_draft).length;

  const currentStats = {
    totalCases: testCases.length,
    pass: livePass,
    passPct: totalJudgments ? Math.round((livePass / totalJudgments) * 100) : 0,
    issues: liveIssues,
    issuesPct: totalJudgments ? Math.round((liveIssues / totalJudgments) * 100) : 0,
    critical: liveCritical,
    criticalPct: totalJudgments ? Math.round((liveCritical / totalJudgments) * 100) : 0,
    privacy: livePrivacyFailures,
    privacyPct: totalJudgments ? Math.round((livePrivacyFailures / totalJudgments) * 100) : 0,
    disagreements: {
      total: disagreements.length,
      resolved: disagreements.filter(d => d.status === 'Resolved').length,
      pending: disagreements.filter(d => d.status !== 'Resolved').length
    }
  };

  const technicalReviewers = reviewers.filter(r => r.reviewer_type.includes('Technical'));
  const domainReviewers = reviewers.filter(r => r.reviewer_type.includes('Domain'));

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center space-x-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/30 text-blue-300 border border-blue-400/30">
                Evaluation Pilot Scope
              </span>
              <span className="text-xs text-slate-300">
                Independent AI Quality, Retrieval, Citation &amp; Privacy Verification
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              ExpertBay – AI Quality &amp; Privacy Evaluation Pilot
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Evaluating an existing AI answering system across engineering questions and Indian home-service product retrieval under double-blind review protocols.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('workspace')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all flex items-center space-x-2"
            >
              <span>Review Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notice & Active Dataset Indicator */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span>
              <strong>Methodology Notice:</strong> Evaluations are performed independently by verified Technical &amp; Domain reviewers prior to final sign-off.
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-blue-900/60 px-3 py-1.5 rounded-xl border border-blue-700/60 text-blue-200">
            <Database className="w-3.5 h-3.5 text-blue-300" />
            <span className="text-xs font-semibold">Active Demo Dataset ({testCases.length} Cases)</span>
          </div>
        </div>
      </div>

      {/* SUMMARY STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Total Cases */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Cases</span>
            <Database className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {currentStats.totalCases}
            </span>
            <p className="text-[11px] text-slate-500">
              {liveReviewedCases.length} Reviewed / {livePendingCases.length} Pending
            </p>
          </div>
        </div>

        {/* Pass */}
        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pass</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                {currentStats.pass}
              </span>
              <span className="text-xs font-semibold text-emerald-700">
                ({currentStats.passPct}%)
              </span>
            </div>
            <p className="text-[11px] text-emerald-600/80">Meets 5-dim evaluation criteria</p>
          </div>
        </div>

        {/* Issues */}
        <div className="p-4 rounded-2xl bg-white border border-amber-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Issues</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-amber-600 tracking-tight">
                {currentStats.issues}
              </span>
              <span className="text-xs font-semibold text-amber-700">
                ({currentStats.issuesPct}%)
              </span>
            </div>
            <p className="text-[11px] text-amber-600/80">Minor factual or citation errors</p>
          </div>
        </div>

        {/* Critical */}
        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Critical</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-rose-600 tracking-tight">
                {currentStats.critical}
              </span>
              <span className="text-xs font-semibold text-rose-700">
                ({currentStats.criticalPct}%)
              </span>
            </div>
            <p className="text-[11px] text-rose-600/80">Safety &amp; electrical hazards</p>
          </div>
        </div>

        {/* Privacy */}
        <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-indigo-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Privacy</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold text-indigo-600 tracking-tight">
                {currentStats.privacy}
              </span>
              <span className="text-xs font-semibold text-indigo-700">
                ({currentStats.privacyPct}%)
              </span>
            </div>
            <p className="text-[11px] text-indigo-600/80">PII &amp; DPDP compliance risks</p>
          </div>
        </div>

      </div>

      {/* REVIEW & VERIFICATION WORKFLOW SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Reviewer Disagreements Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                  <GitCompare className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Reviewer Disagreements</h2>
                  <p className="text-[11px] text-slate-500">2-Reviewer Double-Blind Adjudication</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('disagreements')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center"
              >
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>

            {/* Disagreement Metric Pill */}
            <div className="my-5 p-4 rounded-xl bg-purple-50/60 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-purple-900">Adjudication Pipeline</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-200 text-purple-900 font-bold">
                  2-Reviewer Protocol
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-white shadow-xs border border-purple-100">
                  <div className="text-2xl font-black text-slate-800">{currentStats.disagreements.total}</div>
                  <div className="text-[11px] text-slate-500 font-medium">Total</div>
                </div>
                <div className="p-3 rounded-lg bg-white shadow-xs border border-purple-100">
                  <div className="text-2xl font-black text-emerald-600">{currentStats.disagreements.resolved}</div>
                  <div className="text-[11px] text-emerald-700 font-medium">Resolved</div>
                </div>
                <div className="p-3 rounded-lg bg-white shadow-xs border border-purple-100">
                  <div className="text-2xl font-black text-amber-600">{currentStats.disagreements.pending}</div>
                  <div className="text-[11px] text-amber-700 font-medium">Pending</div>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <p className="font-semibold text-slate-700 mb-1">Adjudication Workflow:</p>
              When Reviewer A and Reviewer B reach differing verdicts (e.g. Pass vs Issue), the case is automatically escalated into the Adjudication Pipeline where an independent Lead Adjudicator evaluates both rationales to provide the binding verdict.
            </div>
          </div>

          <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">{currentStats.disagreements.pending} Case(s) Awaiting Resolution</span>
            <button
              onClick={() => onNavigate('disagreements')}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <span>Open Adjudication</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Reviewer Pool Verification Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Reviewer Pool Verification</h2>
                  <p className="text-[11px] text-slate-500">Independence &amp; Competency Tracking</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('reviewers')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center"
              >
                <span>Manage Pool</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>

            {/* Reviewer Capability Split: Type 1 & Type 2 */}
            <div className="space-y-3 my-5">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs hover:border-slate-300 transition-colors">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-bold text-slate-800 text-sm">Type 1: Technical / AI Reviewers</p>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">FastAPI, React, Postgres, Retrieval, DPDP Privacy</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                  {technicalReviewers.length} Verified
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs hover:border-slate-300 transition-colors">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-bold text-slate-800 text-sm">Type 2: Home-Service Domain Reviewers</p>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">AC, Water, Laundry • Hindi, Tamil, Marathi</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                  {domainReviewers.length} Verified
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
              <p className="font-semibold text-emerald-950 mb-1 flex items-center">
                <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-700" />
                Independence Verification: 100% Verified
              </p>
              Reviewers operate under double-blind isolation without seeing peer scores or LLM system prompts until final evaluation submission.
            </div>
          </div>

          <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">{reviewers.length} Total Verified Reviewers in Roster</span>
            <button
              onClick={() => onNavigate('reviewers')}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
            >
              <span>Manage Reviewers</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
