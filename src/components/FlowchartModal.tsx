import React from 'react';
import { 
  X, GitBranch, ArrowRight, CheckCircle2, Shield, 
  Database, Sliders, Users, CheckSquare, GitCompare, 
  AlertTriangle, BarChart3, FileText, Sparkles, ExternalLink
} from 'lucide-react';
import { NavItem } from './Sidebar';

interface FlowchartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToStage: (tab: NavItem) => void;
}

export const FlowchartModal: React.FC<FlowchartModalProps> = ({
  isOpen,
  onClose,
  onNavigateToStage
}) => {
  if (!isOpen) return null;

  const stages = [
    {
      num: 1,
      title: 'Inputs & Test Material',
      color: 'border-blue-300 bg-blue-50/50 text-blue-900',
      tab: 'test_material' as NavItem,
      items: [
        '180 Engineering Draft Questions (unreviewed starting material)',
        '84 Product Retrieval Smoke Probes (unreviewed starting material)',
        'Additional Natural-Language Questions & Held-out Cases',
        'Reference Sources (manufacturer/regulator guidance, product docs)'
      ]
    },
    {
      num: 2,
      title: 'Define Evaluation Criteria',
      color: 'border-teal-300 bg-teal-50/50 text-teal-900',
      tab: 'criteria' as NavItem,
      items: [
        'Answer Accuracy (factual correctness, completeness)',
        'Citation Relevance (right source, proper reference)',
        'Retrieval Quality (relevance, recall, precision)',
        'Privacy Compliance (PII, data handling, access control)',
        'Safety (unsafe advice, harmful content, refusal when needed)'
      ]
    },
    {
      num: 3,
      title: 'Assign Independent Reviewers',
      color: 'border-purple-300 bg-purple-50/50 text-purple-900',
      tab: 'reviewers' as NavItem,
      items: [
        'Technical / AI Evaluation Reviewer (Python/FastAPI/React/PostgreSQL, Retrieval & Privacy engineering; zero implementation involvement)',
        'Home-Service Domain Reviewers (Manufacturer & regulator guidance, Indian products & brands, categories & languages)',
        'Explicit Qualification & Independence Verification Gates'
      ]
    },
    {
      num: 4,
      title: 'Review & Evaluation Process',
      color: 'border-emerald-300 bg-emerald-50/50 text-emerald-900',
      tab: 'workspace' as NavItem,
      items: [
        'Review Test Items (engineer questions + product probes)',
        'Assess & Score (5-dimension rubric)',
        'Independent Judgments (2+ reviewers per case without peer leakage)',
        'Track Disagreements (document & adjudicate)',
        'Identify Failures (safety, privacy, quality issues)'
      ]
    },
    {
      num: 5,
      title: 'Evaluation & Reporting',
      color: 'border-amber-300 bg-amber-50/50 text-amber-900',
      tab: 'reports' as NavItem,
      items: [
        'Consolidate Results (scores, findings, trends)',
        'Highlight Key Issues (safety, privacy, critical failures)',
        'Summarize Disagreements (with adjudication rationale)',
        'Provide Recommendations (improvement areas, next steps)'
      ]
    },
    {
      num: 6,
      title: 'Demo Output (AI Evaluation Dashboard)',
      color: 'border-indigo-300 bg-indigo-50/50 text-indigo-900',
      tab: 'overview' as NavItem,
      items: [
        'Total Cases: 264 | Pass: 198 (75%) | Issues: 42 (16%) | Critical: 12 (5%) | Privacy: 12 (5%)',
        'Quality Score: 82% (+5% trend) with Accuracy, Retrieval, Citation, Privacy, Safety breakdown',
        'Top Findings: Hallucinations (18), Citations (12), Privacy (7), Safety (5)',
        'Disagreements: Total 24 | Resolved 18 | Pending 6'
      ]
    },
    {
      num: 7,
      title: 'Final Deliverables',
      color: 'border-sky-300 bg-sky-50/50 text-sky-900',
      tab: 'reports' as NavItem,
      items: [
        '1. Evaluation Scorecard (overall & category-wise)',
        '2. Case-Level Judgments (per question/probe)',
        '3. Disagreement Log (with adjudication)',
        '4. Safety & Privacy Report (critical/high/medium/low)',
        '5. Actionable Recommendations (improvement roadmap)'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur">
              <GitBranch className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">AI Quality &amp; Privacy Evaluation Pilot Flowchart</h2>
              <p className="text-xs text-blue-200 font-medium">
                Independent review • Better quality • Safer AI • Trusted outcomes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-950 flex items-start space-x-3">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-blue-900">Interactive Architecture Navigation: </span>
              Click any flowchart phase below to immediately jump into that functional module in the live demo application. All 7 flowchart stages and 5 deliverables are fully interactive and connected to live application data.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stages.map((stg) => (
              <div 
                key={stg.num}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:shadow-md hover:border-blue-400 ${stg.color}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      {stg.num}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Phase {stg.num}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mb-2.5">{stg.title}</h3>
                  <ul className="space-y-1.5 text-xs text-slate-600 mb-4">
                    {stg.items.map((it, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5 leading-relaxed">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => {
                    onNavigateToStage(stg.tab);
                    onClose();
                  }}
                  className="w-full mt-2 py-2 px-3 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-semibold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center justify-center space-x-1.5 shadow-sm group"
                >
                  <span>Explore Phase {stg.num} in App</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            ))}
          </div>

          {/* Outcome Banner */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-sm">
                🤝
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-blue-300 font-semibold">Strategic Pilot Outcome</p>
                <p className="text-sm font-medium text-slate-100">
                  A clear, independent assessment of AI quality and privacy — with evidence, insights and actionable next steps.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onNavigateToStage('reports');
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold whitespace-nowrap shadow-md transition-colors"
            >
              View 4 Deliverables
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
