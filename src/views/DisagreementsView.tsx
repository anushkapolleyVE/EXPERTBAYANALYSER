import React, { useState } from 'react';
import { 
  GitCompare, CheckCircle2, AlertTriangle, ShieldAlert, 
  UserCheck, Scale, ArrowRight, X, Clock, HelpCircle, 
  FileText, Check, ChevronRight, Sparkles
} from 'lucide-react';
import { Disagreement, Reviewer, TestCase } from '../types';

interface DisagreementsViewProps {
  disagreements: Disagreement[];
  reviewers: Reviewer[];
  testCases: TestCase[];
  onResolveDisagreement: (disagId: number | string, payload: {
    final_resolution_verdict: string;
    adjudication_rationale: string;
    adjudicator_id: number;
  }) => Promise<void>;
  onNavigateToWorkspace: (caseId: number) => void;
}

export const DisagreementsView: React.FC<DisagreementsViewProps> = ({
  disagreements,
  reviewers,
  testCases,
  onResolveDisagreement,
  onNavigateToWorkspace
}) => {
  const [selectedDisagreement, setSelectedDisagreement] = useState<Disagreement | null>(null);
  const [resolutionModalDisag, setResolutionModalDisag] = useState<Disagreement | null>(null);

  // Adjudication Form state
  const [adjudicatorId, setAdjudicatorId] = useState<number>(reviewers[0]?.id || 1);
  const [finalVerdict, setFinalVerdict] = useState<string>('Issue');
  const [adjudicationRationale, setAdjudicationRationale] = useState<string>('');

  const resolvedCount = disagreements.filter(d => d.status === 'Resolved').length;
  const pendingCount = disagreements.filter(d => d.status !== 'Resolved').length;
  const totalCount = disagreements.length;

  // Cohen's Kappa Agreement Metric simulation & explanation (Section 10)
  // Observed Agreement P_o = 0.88, Expected Agreement P_e = 0.62 -> Cohen's Kappa ~ 0.68 (Substantial Agreement)
  const cohensKappa = 0.68;

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionModalDisag || !adjudicationRationale) return;
    await onResolveDisagreement(resolutionModalDisag.id, {
      final_resolution_verdict: finalVerdict,
      adjudication_rationale: adjudicationRationale,
      adjudicator_id: adjudicatorId
    });
    setResolutionModalDisag(null);
    setAdjudicationRationale('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <GitCompare className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">Independent Judgments &amp; Disagreement Adjudication</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
              Stage 4: Adjudication
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Comparing independent Reviewer A vs Reviewer B evaluations, reconciling conflicting dimensions, and tracking arbitration decisions.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 font-bold border border-purple-200">
            {pendingCount} Pending Adjudication
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
            {resolvedCount} Resolved
          </span>
        </div>
      </div>

      {/* Disagreement & Inter-Rater Agreement Statistics (Section 10) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Total Disagreements */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Disagreements</span>
          <div className="text-3xl font-black text-slate-900 mt-1">{totalCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Across multi-reviewer cases</p>
        </div>

        {/* Resolved */}
        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-sm">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Resolved</span>
          <div className="text-3xl font-black text-emerald-600 mt-1">{resolvedCount}</div>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">Adjudicated with logged rationale</p>
        </div>

        {/* Pending Disputes */}
        <div className="p-4 rounded-2xl bg-white border border-amber-100 shadow-sm">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Action</span>
          <div className="text-3xl font-black text-amber-600 mt-1">{pendingCount}</div>
          <p className="text-[11px] text-amber-600/80 mt-0.5">Awaiting panel adjudication</p>
        </div>

        {/* Statistical Agreement Measure: Cohen's Kappa */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 shadow-sm">
          <div className="flex items-center justify-between text-indigo-900">
            <span className="text-xs font-bold uppercase tracking-wider">Cohen's Kappa (κ)</span>
            <Scale className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-indigo-700">{cohensKappa}</span>
            <span className="text-xs font-bold text-indigo-900">Substantial</span>
          </div>
          <p className="text-[10px] text-indigo-800/80 mt-0.5">
            Inter-rater reliability adjusted for chance agreement (N=2-reviewer sample).
          </p>
        </div>

      </div>

      {/* Disagreements List & Side-by-Side Comparison */}
      <div className="space-y-4">
        {disagreements.map((disag) => {
          const revA = reviewers.find(r => r.id === disag.reviewer_a_id);
          const revB = reviewers.find(r => r.id === disag.reviewer_b_id);
          const isPending = disag.status !== 'Resolved';
          const isSafetyOrPrivacy = disag.category === 'Safety' || disag.category === 'Privacy';

          return (
            <div 
              key={disag.id}
              className={`p-5 rounded-2xl bg-white border shadow-sm transition-all ${
                isSafetyOrPrivacy ? 'border-rose-200' : 'border-slate-200/80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs font-bold text-slate-800">{disag.disagreement_id}</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    Case: {disag.case_code}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isSafetyOrPrivacy ? 'bg-rose-100 text-rose-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    Dispute: {disag.category}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    disag.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                  }`}>
                    {disag.status}
                  </span>

                  {isPending && (
                    <button
                      onClick={() => {
                        setResolutionModalDisag(disag);
                        setFinalVerdict('Issue');
                        setAdjudicationRationale('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm flex items-center space-x-1"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Adjudicate Dispute</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Case Query Prompt */}
              <div className="my-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">Evaluated Query</span>
                <p className="text-slate-800 font-medium">{disag.case_prompt}</p>
              </div>

              {/* SIDE-BY-SIDE REVIEWER COMPARISON */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                
                {/* Reviewer A Column */}
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                    <span className="font-bold text-blue-950">
                      Reviewer A: {disag.conflicting_verdicts.reviewer_a?.name || revA?.full_name || 'Reviewer #1'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                      disag.conflicting_verdicts.reviewer_a?.verdict === 'Pass' ? 'bg-emerald-100 text-emerald-800' :
                      disag.conflicting_verdicts.reviewer_a?.verdict === 'Critical Failure' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      Verdict: {disag.conflicting_verdicts.reviewer_a?.verdict || 'Issue'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Reviewer Assessment</span>
                    <p className="text-slate-700 mt-0.5 leading-relaxed">
                      {disag.conflicting_verdicts.reviewer_a?.dimension || 'Flagged citation mismatch and potential membrane degradation risks.'}
                    </p>
                  </div>
                </div>

                {/* Reviewer B Column */}
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                    <span className="font-bold text-purple-950">
                      Reviewer B: {disag.conflicting_verdicts.reviewer_b?.name || revB?.full_name || 'Reviewer #2'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                      disag.conflicting_verdicts.reviewer_b?.verdict === 'Pass' ? 'bg-emerald-100 text-emerald-800' :
                      disag.conflicting_verdicts.reviewer_b?.verdict === 'Critical Failure' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      Verdict: {disag.conflicting_verdicts.reviewer_b?.verdict || 'Pass'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Reviewer Assessment</span>
                    <p className="text-slate-700 mt-0.5 leading-relaxed">
                      {disag.conflicting_verdicts.reviewer_b?.dimension || 'Assessed advice as common DIY household guidance without electrical or toxicity hazard.'}
                    </p>
                  </div>
                </div>

              </div>

              {/* Resolved Adjudication Record (if resolved) */}
              {disag.status === 'Resolved' && (
                <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-950">
                    <span className="flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1" />
                      <span>Adjudicated Final Verdict: {disag.final_resolution_verdict}</span>
                    </span>
                    <span className="text-[10px] text-emerald-700">
                      Resolved: {disag.resolved_at ? new Date(disag.resolved_at).toLocaleDateString() : 'Active'}
                    </span>
                  </div>
                  <p className="text-emerald-900 leading-relaxed pt-0.5">
                    <strong>Adjudication Rationale:</strong> {disag.adjudication_rationale}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* RESOLUTION / ADJUDICATION MODAL */}
      {resolutionModalDisag && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs animate-in fade-in">
            <div className="flex items-center space-x-2 text-blue-700 pb-2 border-b border-slate-200">
              <Scale className="w-5 h-5" />
              <h2 className="text-sm font-bold text-slate-900">
                Adjudicate Disagreement: {resolutionModalDisag.disagreement_id}
              </h2>
            </div>

            <p className="text-slate-600 leading-relaxed">
              As an authorized adjudicator, review the competing rationales of Reviewer A and Reviewer B, examine manufacturer evidence, and issue a binding arbitration verdict.
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adjudicator Assignment</label>
                <select
                  value={adjudicatorId}
                  onChange={(e) => setAdjudicatorId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {reviewers.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.full_name} ({r.reviewer_id}) — {r.reviewer_type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Final Binding Verdict *</label>
                <select
                  value={finalVerdict}
                  onChange={(e) => setFinalVerdict(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold"
                >
                  <option value="Pass">Pass (Acceptable answer)</option>
                  <option value="Issue">Issue (Minor flaw; requires refinement)</option>
                  <option value="Critical Failure">Critical Failure (Safety / Privacy violation)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adjudication Rationale &amp; Evidence Grounding *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="State technical justification, citing official OEM service bulletins or standards..."
                  value={adjudicationRationale}
                  onChange={(e) => setAdjudicationRationale(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setResolutionModalDisag(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Record Binding Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
