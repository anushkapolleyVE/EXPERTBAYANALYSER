import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavItem } from './components/Sidebar';
import { FlowchartModal } from './components/FlowchartModal';
import { OverviewView } from './views/OverviewView';
import { TestMaterialView } from './views/TestMaterialView';
import { EvaluationCriteriaView } from './views/EvaluationCriteriaView';
import { ReviewersView } from './views/ReviewersView';
import { AssignmentsView } from './views/AssignmentsView';
import { EvaluationWorkspaceView } from './views/EvaluationWorkspaceView';
import { DisagreementsView } from './views/DisagreementsView';
import { FailuresView } from './views/FailuresView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';

import { 
  TestCase, Reviewer, Assignment, Judgment, Disagreement, 
  Finding, Recommendation, AuditLogItem, UserProfile 
} from './types';
import { DEMO_USERS } from './mockData';
import { api } from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavItem>('overview');
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_USERS[0]);
  const [isFlowchartOpen, setIsFlowchartOpen] = useState(false);
  const [selectedCaseForWorkspace, setSelectedCaseForWorkspace] = useState<number | undefined>(undefined);

  // Core Application Data State
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [judgments, setJudgments] = useState<Judgment[]>([]);
  const [disagreements, setDisagreements] = useState<Disagreement[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Initial Data Fetch
  const loadAllData = async () => {
    try {
      const [
        casesData,
        reviewersData,
        assignmentsData,
        judgmentsData,
        disagreementsData,
        findingsData,
        recommendationsData,
        auditLogsData
      ] = await Promise.all([
        api.getTestCases(),
        api.getReviewers(),
        api.getAssignments(),
        api.getJudgments(),
        api.getDisagreements(),
        api.getFindings(),
        api.getRecommendations(),
        api.getAuditLogs()
      ]);

      setTestCases(casesData);
      setReviewers(reviewersData);
      setAssignments(assignmentsData);
      setJudgments(judgmentsData);
      setDisagreements(disagreementsData);
      setFindings(findingsData);
      setRecommendations(recommendationsData);
      setAuditLogs(auditLogsData);
    } catch (e) {
      console.error('Error loading evaluation data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await api.login(currentUser.email, currentUser.role);
      await loadAllData();
    };
    init();
  }, []);

  const handleSelectUser = async (user: UserProfile) => {
    setCurrentUser(user);
    await api.login(user.email, user.role);
    showToast(`Switched active reviewer to: ${user.name.split(' (')[0]}`);
  };


  // Handlers for mutations
  const handleAddCase = async (newCase: Partial<TestCase>) => {
    try {
      const created = await api.createTestCase(newCase);
      setTestCases(prev => [created, ...prev]);
      showToast(`Test Case ${created.case_id} added successfully.`);
    } catch (e: any) {
      showToast(`Error adding case: ${e.message}`);
    }
  };

  const handleUpdateCase = async (id: number | string, updates: Partial<TestCase>) => {
    try {
      const updated = await api.updateTestCase(id, updates);
      setTestCases(prev => prev.map(c => (c.id === id || c.case_id === id ? updated : c)));
      showToast(`Test Case ${updated.case_id} updated.`);
    } catch (e: any) {
      showToast(`Error updating case: ${e.message}`);
    }
  };

  const handleNominateReviewer = async (newRev: Partial<Reviewer>) => {
    try {
      const created = await api.nominateReviewer(newRev);
      setReviewers(prev => [...prev, created]);
      showToast(`Candidate ${created.full_name} (${created.reviewer_id}) nominated!`);
    } catch (e: any) {
      showToast(`Error nominating reviewer: ${e.message}`);
    }
  };

  const handleVerifyReviewer = async (id: number | string, verifyData: any) => {
    try {
      const updated = await api.verifyReviewer(id, verifyData);
      setReviewers(prev => prev.map(r => (r.id === id || r.reviewer_id === id ? updated : r)));
      showToast(`Verification for ${updated.full_name} updated to ${updated.verification_status}.`);
    } catch (e: any) {
      showToast(`Error updating reviewer: ${e.message}`);
    }
  };

  const handleCreateAssignment = async (payload: any) => {
    try {
      await api.createAssignment(payload);
      const asgns = await api.getAssignments();
      setAssignments(asgns);
      showToast('Reviewer assignment successfully recorded.');
    } catch (e: any) {
      showToast(`Assignment error: ${e.message}`);
    }
  };

  const handleSubmitJudgment = async (judgmentData: Partial<Judgment>) => {
    try {
      const saved = await api.submitJudgment(judgmentData);
      // Reload judgments, cases, and disagreements
      const [freshJudgments, freshCases, freshDisagreements, freshFindings] = await Promise.all([
        api.getJudgments(),
        api.getTestCases(),
        api.getDisagreements(),
        api.getFindings()
      ]);
      setJudgments(freshJudgments);
      setTestCases(freshCases);
      setDisagreements(freshDisagreements);
      setFindings(freshFindings);

      showToast(`Judgment submitted with verdict: "${saved.overall_verdict}". Locked for audit.`);
    } catch (e: any) {
      showToast(`Judgment submission failed: ${e.message}`);
      throw e;
    }
  };

  const handleResolveDisagreement = async (disagId: number | string, payload: any) => {
    try {
      await api.resolveDisagreement(disagId, payload);
      const [freshDisagreements, freshCases] = await Promise.all([
        api.getDisagreements(),
        api.getTestCases()
      ]);
      setDisagreements(freshDisagreements);
      setTestCases(freshCases);
      showToast('Disagreement binding arbitration verdict recorded.');
    } catch (e: any) {
      showToast(`Disagreement resolution failed: ${e.message}`);
    }
  };

  const handleUpdateFinding = async (findingId: number | string, updates: Partial<Finding>) => {
    try {
      const updated = await api.updateFinding(findingId, updates);
      setFindings(prev => prev.map(f => (f.id === findingId || f.finding_id === findingId ? updated : f)));
      showToast(`Finding ${updated.finding_id} status updated to "${updated.status}".`);
    } catch (e: any) {
      showToast(`Failed to update finding: ${e.message}`);
    }
  };

  // Navigate to workspace with specific case
  const handleNavigateToWorkspaceWithCase = (caseId: number) => {
    setSelectedCaseForWorkspace(caseId);
    setCurrentTab('workspace');
  };

  const criticalFindingsCount = findings.filter(f => f.severity === 'Critical' && f.status !== 'Verified Closed').length;
  const pendingDisagreementsCount = disagreements.filter(d => d.status !== 'Resolved').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        availableUsers={DEMO_USERS}
        onSelectUser={handleSelectUser}
        onOpenFlowchart={() => setIsFlowchartOpen(true)}
        criticalFindingsCount={criticalFindingsCount}
        onRefreshData={loadAllData}
      />

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Persistent Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingDisagreementsCount={pendingDisagreementsCount}
          criticalFailuresCount={criticalFindingsCount}
          totalCasesCount={testCases.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          
          {isLoading ? (
            <div className="flex items-center justify-center py-24 text-slate-400 space-x-2">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Loading ExpertBay Evaluation Pipeline...</span>
            </div>
          ) : (
            <>
              {currentTab === 'overview' && (
                <OverviewView
                  testCases={testCases}
                  reviewers={reviewers}
                  assignments={assignments}
                  judgments={judgments}
                  disagreements={disagreements}
                  findings={findings}
                  recommendations={recommendations}
                  auditLogs={auditLogs}
                  onNavigate={setCurrentTab}
                  onOpenFlowchart={() => setIsFlowchartOpen(true)}
                />
              )}

              {currentTab === 'test_material' && (
                <TestMaterialView
                  testCases={testCases}
                  onAddCase={handleAddCase}
                  onUpdateCase={handleUpdateCase}
                  onNavigateToWorkspace={handleNavigateToWorkspaceWithCase}
                />
              )}

              {currentTab === 'criteria' && (
                <EvaluationCriteriaView />
              )}

              {currentTab === 'reviewers' && (
                <ReviewersView
                  reviewers={reviewers}
                  onNominateReviewer={handleNominateReviewer}
                  onVerifyReviewer={handleVerifyReviewer}
                />
              )}

              {currentTab === 'assignments' && (
                <AssignmentsView
                  assignments={assignments}
                  testCases={testCases}
                  reviewers={reviewers}
                  onCreateAssignment={handleCreateAssignment}
                  onNavigateToWorkspace={handleNavigateToWorkspaceWithCase}
                />
              )}

              {currentTab === 'workspace' && (
                <EvaluationWorkspaceView
                  testCases={testCases}
                  selectedCaseId={selectedCaseForWorkspace}
                  currentUser={currentUser}
                  reviewers={reviewers}
                  judgments={judgments}
                  onSubmitJudgment={handleSubmitJudgment}
                  onNavigateToDisagreements={() => setCurrentTab('disagreements')}
                />
              )}

              {currentTab === 'disagreements' && (
                <DisagreementsView
                  disagreements={disagreements}
                  reviewers={reviewers}
                  testCases={testCases}
                  onResolveDisagreement={handleResolveDisagreement}
                  onNavigateToWorkspace={handleNavigateToWorkspaceWithCase}
                />
              )}

              {currentTab === 'failures' && (
                <FailuresView
                  findings={findings}
                  onUpdateFinding={handleUpdateFinding}
                  onNavigateToWorkspace={handleNavigateToWorkspaceWithCase}
                />
              )}

              {currentTab === 'reports' && (
                <ReportsView
                  testCases={testCases}
                  reviewers={reviewers}
                  judgments={judgments}
                  disagreements={disagreements}
                  findings={findings}
                  recommendations={recommendations}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsView
                  auditLogs={auditLogs}
                />
              )}
            </>
          )}

        </main>
      </div>

      {/* Interactive 7-Stage Flowchart Modal */}
      <FlowchartModal
        isOpen={isFlowchartOpen}
        onClose={() => setIsFlowchartOpen(false)}
        onNavigateToStage={(tab) => {
          setCurrentTab(tab);
          setIsFlowchartOpen(false);
        }}
      />

      {/* Toast Notification Notification Pill */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center space-x-2.5 animate-in slide-in-from-bottom-3 duration-200">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></div>
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

export default App;
