import React, { useState } from 'react';
import { 
  ClipboardList, Plus, UserCheck, Calendar, Clock, 
  CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, 
  Filter, Search, UserMinus, Shield
} from 'lucide-react';
import { Assignment, TestCase, Reviewer } from '../types';

interface AssignmentsViewProps {
  assignments: Assignment[];
  testCases: TestCase[];
  reviewers: Reviewer[];
  onCreateAssignment: (payload: { case_id: number; reviewer_id: number; assigned_role?: string; deadline?: string }) => Promise<void>;
  onNavigateToWorkspace: (caseId: number) => void;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  assignments,
  testCases,
  reviewers,
  onCreateAssignment,
  onNavigateToWorkspace
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Assignment Modal Form
  const [assignCaseId, setAssignCaseId] = useState<number>(testCases[0]?.id || 1);
  const [assignReviewerId, setAssignReviewerId] = useState<number>(reviewers[0]?.id || 1);
  const [assignRole, setAssignRole] = useState('Secondary Reviewer');
  const [assignDeadline, setAssignDeadline] = useState('2026-03-20');

  // Filtered assignments
  const filteredAssignments = assignments.filter((a) => {
    if (selectedRoleFilter !== 'all' && !a.assigned_role.toLowerCase().includes(selectedRoleFilter.toLowerCase())) return false;
    if (selectedStatusFilter !== 'all' && a.status !== selectedStatusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = 
        (a.assignment_id && a.assignment_id.toLowerCase().includes(q)) ||
        (a.reviewer_name && a.reviewer_name.toLowerCase().includes(q)) ||
        (a.case_code && a.case_code.toLowerCase().includes(q)) ||
        (a.case_prompt && a.case_prompt.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateAssignment({
      case_id: Number(assignCaseId),
      reviewer_id: Number(assignReviewerId),
      assigned_role: assignRole,
      deadline: assignDeadline
    });
    setShowAssignModal(false);
  };

  // Reviewer Workload stats
  const reviewerWorkload = reviewers.map((rev) => {
    const assignedCount = assignments.filter(a => a.reviewer_id === rev.id).length;
    const completedCount = assignments.filter(a => a.reviewer_id === rev.id && a.status === 'Completed').length;
    return {
      reviewer: rev,
      assigned: assignedCount,
      completed: completedCount
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">Reviewer Assignments &amp; Workload</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              Stage 3: Allocation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enforcing the default <strong>2+ independent reviewers per case</strong> evaluation protocol with double-blind isolation.
          </p>
        </div>

        <button
          onClick={() => setShowAssignModal(true)}
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-colors flex items-center space-x-1.5 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Protocol Banner: 2+ Reviewers & Independent Isolation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
          <div className="flex items-center space-x-2 font-bold mb-1">
            <UserCheck className="w-4 h-4 text-blue-700" />
            <span>2+ Reviewers Per Case</span>
          </div>
          <p className="text-[11px] text-blue-800 leading-relaxed">
            Every test question is independently evaluated by at least two certified reviewers (1 Technical + 1 Domain specialist where applicable).
          </p>
        </div>

        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900">
          <div className="flex items-center space-x-2 font-bold mb-1">
            <Shield className="w-4 h-4 text-purple-700" />
            <span>Double-Blind Judgment Lock</span>
          </div>
          <p className="text-[11px] text-purple-800 leading-relaxed">
            Reviewer A and Reviewer B submit ratings independently. Neither reviewer sees peer evaluations until their own judgment is submitted.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
          <div className="flex items-center space-x-2 font-bold mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Domain Category Matching</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            Reviewers are only allocated cases matching verified product categories (e.g. AC cases to HVAC certified technicians).
          </p>
        </div>
      </div>

      {/* Reviewer Workload Matrix */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-800">Reviewer Workload Capacity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reviewerWorkload.map(({ reviewer, assigned, completed }) => (
            <div key={reviewer.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-slate-800">{reviewer.full_name}</p>
                <p className="text-[10px] text-slate-500">{reviewer.reviewer_type}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-blue-700">{completed}/{assigned}</span>
                <p className="text-[10px] text-slate-400">Completed</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assignments Table */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by assignment ID, reviewer name, or case ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex space-x-2">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Assignment ID</th>
                <th className="py-2.5 px-3 font-semibold">Case Target</th>
                <th className="py-2.5 px-3 font-semibold">Assigned Reviewer</th>
                <th className="py-2.5 px-3 font-semibold">Role</th>
                <th className="py-2.5 px-3 font-semibold">Deadline</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssignments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{a.assignment_id}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-blue-700">{a.case_code}</span>
                    <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">{a.case_prompt}</p>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-slate-800">{a.reviewer_name}</span>
                    <span className="text-[10px] text-slate-400 block">{a.reviewer_code}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{a.assigned_role}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{a.deadline}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      a.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                      a.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onNavigateToWorkspace(a.case_id)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors text-xs font-semibold"
                    >
                      Open Case
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ASSIGNMENT MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs animate-in fade-in">
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-200">
              Create Reviewer Assignment
            </h2>

            <form onSubmit={handleAssignSubmit} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Test Case *</label>
                <select
                  value={assignCaseId}
                  onChange={(e) => setAssignCaseId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {testCases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.case_id} — {c.product_category || c.test_category} ({c.brand || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Independent Reviewer *</label>
                <select
                  value={assignReviewerId}
                  onChange={(e) => setAssignReviewerId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {reviewers.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.full_name} ({r.reviewer_id}) — {r.reviewer_type.includes('Technical') ? 'Technical/AI' : 'Domain'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={assignRole}
                    onChange={(e) => setAssignRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Primary Reviewer">Primary Reviewer</option>
                    <option value="Secondary Reviewer">Secondary Reviewer</option>
                    <option value="Adjudicator">Adjudicator</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={assignDeadline}
                    onChange={(e) => setAssignDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px]">
                Reviewer independence will be preserved. Peer ratings will remain hidden until this assignment is formally submitted.
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
