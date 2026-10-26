import React, { useState } from 'react';
import { 
  AlertOctagon, ShieldAlert, AlertTriangle, CheckCircle2, 
  Lock, RefreshCw, Filter, Search, Eye, Shield, 
  ExternalLink, ChevronRight, X
} from 'lucide-react';
import { Finding } from '../types';

interface FailuresViewProps {
  findings: Finding[];
  onUpdateFinding: (id: number | string, updates: Partial<Finding>) => Promise<void>;
  onNavigateToWorkspace: (caseId: number) => void;
}

export const FailuresView: React.FC<FailuresViewProps> = ({
  findings,
  onUpdateFinding,
  onNavigateToWorkspace
}) => {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [remediationModalFinding, setRemediationModalFinding] = useState<Finding | null>(null);
  const [remediationText, setRemediationText] = useState('');
  const [newStatus, setNewStatus] = useState<string>('In Remediation');

  const filteredFindings = findings.filter((f) => {
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = 
        f.finding_id.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.case_code.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const criticalOpenCount = findings.filter(f => f.severity === 'Critical' && f.status !== 'Verified Closed').length;
  const isSignoffBlocked = criticalOpenCount > 0;

  const handleRemediationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remediationModalFinding) return;
    await onUpdateFinding(remediationModalFinding.id, {
      status: newStatus as any,
      remediation_recommendation: remediationText || remediationModalFinding.remediation_recommendation
    });
    setRemediationModalFinding(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-5 h-5 text-rose-600" />
            <h1 className="text-lg font-bold text-slate-900">Safety &amp; Privacy Failure Tracking</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
              Stage 4: Failures
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking severe failures, root cause evidence, and mandatory stop-gates blocking pilot sign-off.
          </p>
        </div>

        {/* Pilot Sign-Off Stop Gate Indicator */}
        <div className={`px-4 py-2 rounded-xl border flex items-center space-x-2.5 ${
          isSignoffBlocked 
            ? 'bg-rose-50 border-rose-300 text-rose-900' 
            : 'bg-emerald-50 border-emerald-300 text-emerald-900'
        }`}>
          {isSignoffBlocked ? (
            <Lock className="w-4 h-4 text-rose-600 animate-pulse" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          )}
          <div className="text-xs">
            <div className="font-bold">
              {isSignoffBlocked ? 'Pilot Sign-Off BLOCKED' : 'Sign-Off Gate Clear'}
            </div>
            <div className="text-[10px] text-slate-500">
              {criticalOpenCount} Critical findings require resolution
            </div>
          </div>
        </div>
      </div>

      {/* Stop Gate Policy Alert */}
      <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-xs text-rose-950 flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-rose-900">Mandatory Pilot Sign-Off Stop Criteria (Section 11)</p>
          <p className="text-rose-800 leading-relaxed">
            Per ExpertBay evaluation governance, unresolved critical findings (such as hazardous R32 refrigerant venting instructions or customer PII leaks) strictly block final pilot certification. Critical failures must be mitigated and verified closed by an independent compliance officer.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search finding ID, description, case code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200"
          />
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
        >
          <option value="all">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
        >
          <option value="all">All Categories</option>
          <option value="Safety Failure">Safety Failure</option>
          <option value="Privacy Risk">Privacy Risk</option>
          <option value="Incorrect Citation">Incorrect Citation</option>
          <option value="Hallucination">Hallucination</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Remediation">In Remediation</option>
          <option value="Resolved">Resolved</option>
          <option value="Verified Closed">Verified Closed</option>
        </select>
      </div>

      {/* Findings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Finding ID</th>
                <th className="py-3 px-4 font-semibold">Severity &amp; Category</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">Case Link</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFindings.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-800">
                    {f.finding_id}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      f.severity === 'Critical' ? 'bg-rose-100 text-rose-800' :
                      f.severity === 'High' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {f.severity}
                    </span>
                    <span className="block text-[11px] text-slate-600 font-semibold mt-0.5">{f.category}</span>
                  </td>

                  <td className="py-3 px-4 max-w-sm">
                    <p className="line-clamp-2 text-slate-800 font-medium">{f.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">Evidence: {f.evidence}</p>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap font-mono font-semibold text-blue-700">
                    <button
                      onClick={() => onNavigateToWorkspace(f.case_id)}
                      className="hover:underline flex items-center space-x-1"
                    >
                      <span>{f.case_code}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      f.status === 'Verified Closed' ? 'bg-emerald-100 text-emerald-800' :
                      f.status === 'In Remediation' ? 'bg-blue-100 text-blue-800' :
                      f.status === 'Resolved' ? 'bg-purple-100 text-purple-800' :
                      'bg-rose-100 text-rose-800 animate-pulse'
                    }`}>
                      {f.status}
                    </span>
                    {f.blocks_pilot_signoff && f.status !== 'Verified Closed' && (
                      <span className="block text-[9px] text-rose-600 font-bold mt-0.5">BLOCKS SIGN-OFF</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                    <button
                      onClick={() => setSelectedFinding(f)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                      title="Inspect Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setRemediationModalFinding(f);
                        setRemediationText(f.remediation_recommendation || '');
                        setNewStatus(f.status);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors text-xs font-semibold"
                    >
                      Remediate / Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-slate-800">{selectedFinding.finding_id}</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                  {selectedFinding.severity}
                </span>
              </div>
              <button onClick={() => setSelectedFinding(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Description</span>
                <p className="text-slate-800 text-xs font-medium mt-0.5">{selectedFinding.description}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Evidence In AI Answer</span>
                <p className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-rose-900 mt-0.5">
                  "{selectedFinding.evidence}"
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Impact Assessment</span>
                <p className="text-slate-700 text-xs mt-0.5">{selectedFinding.impact}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Remediation Recommendation</span>
                <p className="text-blue-900 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs mt-0.5">
                  {selectedFinding.remediation_recommendation}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedFinding(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REMEDIATION STATUS UPDATE MODAL */}
      {remediationModalFinding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs animate-in fade-in">
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-200">
              Update Finding Status: {remediationModalFinding.finding_id}
            </h2>

            <form onSubmit={handleRemediationSubmit} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Workflow</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Open">Open</option>
                  <option value="In Remediation">In Remediation</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Verified Closed">Verified Closed (Authorized)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remediation Notes / Fix Verification</label>
                <textarea
                  rows={3}
                  value={remediationText}
                  onChange={(e) => setRemediationText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRemediationModalFinding(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
