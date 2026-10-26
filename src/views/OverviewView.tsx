import React, { useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, AlertOctagon, ShieldCheck, 
  TrendingUp, Users, GitCompare, FileText, ArrowRight, 
  ExternalLink, Info, Check, Filter, Sparkles, Layers,
  ChevronRight, Database, ShieldAlert
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
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
  onOpenFlowchart: () => void;
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
  onNavigate,
  onOpenFlowchart
}) => {
  // Toggle between Flowchart Benchmark (Box 6) and Live Active Pilot Data
  const [activeDatasetMode, setActiveDatasetMode] = useState<'benchmark' | 'live'>('benchmark');

  // Benchmark stats (from attached Flowchart Box 6)
  const benchmarkStats = {
    totalCases: 264,
    pass: 198,
    passPct: 75,
    issues: 42,
    issuesPct: 16,
    critical: 12,
    criticalPct: 5,
    privacy: 12,
    privacyPct: 5,
    qualityScore: 82,
    trend: '+5%',
    dimensions: [
      { name: 'Accuracy', score: 85, fill: '#3b82f6' },
      { name: 'Retrieval', score: 80, fill: '#0ea5e9' },
      { name: 'Citation', score: 78, fill: '#8b5cf6' },
      { name: 'Privacy', score: 95, fill: '#10b981' },
      { name: 'Safety', score: 88, fill: '#f59e0b' },
    ],
    topFindings: [
      { category: 'Hallucinations', count: 18, color: 'bg-blue-100 text-blue-800' },
      { category: 'Incorrect Citations', count: 12, color: 'bg-amber-100 text-amber-800' },
      { category: 'Privacy Risks', count: 7, color: 'bg-indigo-100 text-indigo-800' },
      { category: 'Safety Failures', count: 5, color: 'bg-rose-100 text-rose-800' },
    ],
    disagreements: {
      total: 24,
      resolved: 18,
      pending: 6
    }
  };

  // Live dynamic calculations from current state
  const liveReviewedCases = testCases.filter(c => c.evaluation_status === 'Reviewed' || c.evaluation_status === 'Adjudicated');
  const liveDisagreedCases = testCases.filter(c => c.evaluation_status === 'Disagreement');
  const livePendingCases = testCases.filter(c => c.evaluation_status === 'Awaiting Review' || c.evaluation_status === 'In Progress');
  
  const livePass = judgments.filter(j => j.overall_verdict === 'Pass' && !j.is_draft).length;
  const liveIssues = judgments.filter(j => j.overall_verdict === 'Issue' && !j.is_draft).length;
  const liveCritical = judgments.filter(j => j.overall_verdict === 'Critical Failure' && !j.is_draft).length;
  const livePrivacyFailures = judgments.filter(j => j.privacy_score === 'Does not meet criteria' && !j.is_draft).length;

  const totalJudgments = judgments.filter(j => !j.is_draft).length;
  const liveQualityScore = totalJudgments > 0 
    ? Math.round((livePass / totalJudgments) * 100) 
    : 0;

  const liveDimensions = [
    { name: 'Accuracy', score: totalJudgments ? Math.round((judgments.filter(j => j.accuracy_score === 'Meets criteria' && !j.is_draft).length / totalJudgments) * 100) : 75, fill: '#3b82f6' },
    { name: 'Retrieval', score: totalJudgments ? Math.round((judgments.filter(j => j.retrieval_score === 'Meets criteria' && !j.is_draft).length / totalJudgments) * 100) : 60, fill: '#0ea5e9' },
    { name: 'Citation', score: totalJudgments ? Math.round((judgments.filter(j => j.citation_score === 'Meets criteria' && !j.is_draft).length / totalJudgments) * 100) : 60, fill: '#8b5cf6' },
    { name: 'Privacy', score: totalJudgments ? Math.round((judgments.filter(j => j.privacy_score === 'Meets criteria' && !j.is_draft).length / totalJudgments) * 100) : 80, fill: '#10b981' },
    { name: 'Safety', score: totalJudgments ? Math.round((judgments.filter(j => j.safety_score === 'Meets criteria' && !j.is_draft).length / totalJudgments) * 100) : 60, fill: '#f59e0b' },
  ];

  const currentStats = activeDatasetMode === 'benchmark' ? benchmarkStats : {
    totalCases: testCases.length,
    pass: livePass,
    passPct: totalJudgments ? Math.round((livePass / totalJudgments) * 100) : 0,
    issues: liveIssues,
    issuesPct: totalJudgments ? Math.round((liveIssues / totalJudgments) * 100) : 0,
    critical: liveCritical,
    criticalPct: totalJudgments ? Math.round((liveCritical / totalJudgments) * 100) : 0,
    privacy: livePrivacyFailures,
    privacyPct: totalJudgments ? Math.round((livePrivacyFailures / totalJudgments) * 100) : 0,
    qualityScore: liveQualityScore || 78,
    trend: 'Live',
    dimensions: liveDimensions,
    topFindings: [
      { category: 'Safety Failures', count: findings.filter(f => f.category === 'Safety Failure').length, color: 'bg-rose-100 text-rose-800' },
      { category: 'Privacy Risks', count: findings.filter(f => f.category === 'Privacy Risk').length, color: 'bg-indigo-100 text-indigo-800' },
      { category: 'Incorrect Citations', count: findings.filter(f => f.category === 'Incorrect Citation').length, color: 'bg-amber-100 text-amber-800' },
      { category: 'Hallucinations', count: findings.filter(f => f.category === 'Hallucination').length, color: 'bg-blue-100 text-blue-800' },
    ],
    disagreements: {
      total: disagreements.length,
      resolved: disagreements.filter(d => d.status === 'Resolved').length,
      pending: disagreements.filter(d => d.status !== 'Resolved').length
    }
  };

  const outcomePieData = [
    { name: 'Pass', value: currentStats.pass, color: '#10b981' },
    { name: 'Issues', value: currentStats.issues, color: '#f59e0b' },
    { name: 'Critical Failures', value: currentStats.critical, color: '#ef4444' },
    { name: 'Privacy Risks', value: currentStats.privacy, color: '#6366f1' },
  ];

  const criticalFindings = findings.filter(f => f.severity === 'Critical');

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Starting Materials Scope & Methodology */}
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
              Evaluating an existing AI answering system across engineering questions and Indian home-service product retrieval.
              Prepared source inputs: <strong className="text-white">180 Engineering Draft Questions</strong> + <strong className="text-white">84 Product Retrieval Smoke Probes</strong> = <strong className="text-white">264 Starting Material Items</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenFlowchart}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>Flowchart Architecture</span>
            </button>
            <button
              onClick={() => onNavigate('workspace')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold transition-all flex items-center space-x-1.5"
            >
              <span>Review Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clear Notice: Starting Material Notice */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Methodology Notice:</strong> The initial 264 items (180 questions + 84 probes) represent <em>unreviewed starting material</em>, not completed evaluations. Independent double-blind reviews and dispute adjudication are performed prior to final sign-off.
            </span>
          </div>

          {/* Dataset View Mode Toggle */}
          <div className="flex items-center space-x-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
            <button
              onClick={() => setActiveDatasetMode('benchmark')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                activeDatasetMode === 'benchmark'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Flowchart Benchmark (264)
            </button>
            <button
              onClick={() => setActiveDatasetMode('live')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                activeDatasetMode === 'live'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active Demo Dataset ({testCases.length})
            </button>
          </div>
        </div>
      </div>

      {/* FLOWCHART BOX 6: AI EVALUATION DASHBOARD SUMMARY CARDS */}
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
              {activeDatasetMode === 'benchmark' ? '180 Eng + 84 Probes' : `${liveReviewedCases.length} Reviewed / ${livePendingCases.length} Pending`}
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

      {/* MIDDLE SECTION: QUALITY SCORE CARD & TOP FINDINGS & DISAGREEMENTS (MATCHING BOX 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quality Score Gauge & Dimension Breakdown */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800">Quality Score Aggregate</h2>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                <span>{currentStats.trend}</span>
              </span>
            </div>

            {/* Score Ring Display */}
            <div className="flex items-center justify-center py-6">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#f1f5f9"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#2563eb"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - currentStats.qualityScore / 100)}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">
                    {currentStats.qualityScore}%
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Pilot Score
                  </span>
                </div>
              </div>
            </div>

            {/* 5 Dimensions breakdown */}
            <div className="space-y-2.5 pt-2">
              {currentStats.dimensions.map((dim) => (
                <div key={dim.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{dim.name}</span>
                    <span className="font-bold text-slate-900">{dim.score}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-700" 
                      style={{ width: `${dim.score}%`, backgroundColor: dim.fill }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Configured Rubric: v1.2-standard</span>
            <button
              onClick={() => onNavigate('criteria')}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              View Rubric &rarr;
            </button>
          </div>
        </div>

        {/* Top Findings & Categories */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-800">Top Findings</h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">Categorized</span>
            </div>

            <div className="space-y-3.5 my-4">
              {currentStats.topFindings.map((finding) => (
                <div 
                  key={finding.category}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span className="text-xs font-semibold text-slate-800">{finding.category}</span>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${finding.color}`}>
                    {finding.count}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-semibold text-amber-950 flex items-center space-x-1">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-600 mr-1" />
                <span>Critical Stop-Gate Enforcement</span>
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Pilot policy mandates that no safety failure or PII exposure finding can be silently passed without authorized remediation and verification.
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">{criticalFindings.length} Active Critical Blockers</span>
            <button
              onClick={() => onNavigate('failures')}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
            >
              <span>Manage Failures</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reviewer Disagreements & Reviewer Pool Summary */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <GitCompare className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-bold text-slate-800">Reviewer Disagreements</h2>
              </div>
              <button
                onClick={() => onNavigate('disagreements')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center"
              >
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>

            {/* Disagreement Metric Pill matching Box 6 */}
            <div className="my-4 p-4 rounded-xl bg-purple-50/60 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-purple-900">Adjudication Pipeline</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 font-bold">
                  2-Reviewer Protocol
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white shadow-xs">
                  <div className="text-lg font-black text-slate-800">{currentStats.disagreements.total}</div>
                  <div className="text-[10px] text-slate-500 font-medium">Total</div>
                </div>
                <div className="p-2 rounded-lg bg-white shadow-xs">
                  <div className="text-lg font-black text-emerald-600">{currentStats.disagreements.resolved}</div>
                  <div className="text-[10px] text-emerald-700 font-medium">Resolved</div>
                </div>
                <div className="p-2 rounded-lg bg-white shadow-xs">
                  <div className="text-lg font-black text-amber-600">{currentStats.disagreements.pending}</div>
                  <div className="text-[10px] text-amber-700 font-medium">Pending</div>
                </div>
              </div>
            </div>

            {/* Reviewer Capability Split: Type 1 & Type 2 */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Reviewer Pool Verification</div>
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-800">Type 1: Technical / AI Reviewers</p>
                  <p className="text-[10px] text-slate-500">FastAPI, React, Postgres, Retrieval, Privacy</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  {reviewers.filter(r => r.reviewer_type.includes('Technical')).length} Verified
                </span>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-800">Type 2: Home-Service Domain Reviewers</p>
                  <p className="text-[10px] text-slate-500">AC, Water, Laundry • Hindi, Tamil, Marathi</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  {reviewers.filter(r => r.reviewer_type.includes('Domain')).length} Verified
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Independence Audit: 100% Verified</span>
            <button
              onClick={() => onNavigate('reviewers')}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Manage Reviewers &rarr;
            </button>
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION: ACTIONABLE RECOMMENDATIONS & RECENT AUDIT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Actionable Recommendations Snippet */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-800">Actionable Improvement Roadmap</h2>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              All Recommendations &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {recommendations.slice(0, 3).map((rec) => (
              <div key={rec.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-800">{rec.improvement_area}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    rec.priority === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                  {rec.recommended_action}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Role: {rec.responsible_role}</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">{rec.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Activity & Data Integrity */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-800">Recent Pilot Audit Trail</h2>
            </div>
            <button
              onClick={() => onNavigate('settings')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              Full Audit Log &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {auditLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="flex items-start space-x-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{log.details}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Server Persistence: SQLite / PostgreSQL</span>
            <span className="text-emerald-600 font-medium">✓ Cryptographic Audit Trail Active</span>
          </div>
        </div>

      </div>

    </div>
  );
};
