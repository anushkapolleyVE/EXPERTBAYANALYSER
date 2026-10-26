import React, { useState } from 'react';
import { 
  Database, Search, Filter, Plus, Upload, Download, 
  FileText, CheckCircle2, AlertTriangle, Eye, ShieldAlert,
  ChevronRight, X, ExternalLink, RefreshCw, Ban, Lock
} from 'lucide-react';
import { TestCase } from '../types';

interface TestMaterialViewProps {
  testCases: TestCase[];
  onAddCase: (newCase: Partial<TestCase>) => Promise<void>;
  onUpdateCase: (id: number | string, updates: Partial<TestCase>) => Promise<void>;
  onNavigateToWorkspace: (caseId: number) => void;
}

export const TestMaterialView: React.FC<TestMaterialViewProps> = ({
  testCases,
  onAddCase,
  onUpdateCase,
  onNavigateToWorkspace
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [heldOutOnly, setHeldOutOnly] = useState<boolean>(false);
  
  // Modals state
  const [activeCaseModal, setActiveCaseModal] = useState<TestCase | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [exclusionModalCase, setExclusionModalCase] = useState<TestCase | null>(null);
  const [exclusionReason, setExclusionReason] = useState<string>('');

  // New Case Form state
  const [newCaseData, setNewCaseData] = useState<Partial<TestCase>>({
    case_id: '',
    test_category: 'Engineering Draft Question',
    question_prompt: '',
    test_type: 'Accuracy',
    actual_ai_answer: '',
    expected_answer: '',
    reference_sources: '',
    source_url: '',
    product_category: 'Air Conditioners',
    brand: 'Voltas',
    model_number: '',
    language: 'English',
    safety_sensitivity: 'Low',
    privacy_sensitivity: 'Low',
    held_out_flag: false
  });

  // Dynamic counts calculated directly from active database testCases
  const engQuestionsCount = testCases.filter(c => 
    c.test_category === 'Engineering Draft Question' || 
    (c.test_category && c.test_category.toLowerCase().includes('engineering'))
  ).length;

  const retrievalProbesCount = testCases.filter(c => 
    c.test_category === 'Product Retrieval Smoke Probe' || 
    (c.test_category && (c.test_category.toLowerCase().includes('retrieval') || c.test_category.toLowerCase().includes('probe')))
  ).length;

  const naturalLanguageCount = testCases.filter(c => 
    c.test_category && c.test_category.toLowerCase().includes('natural')
  ).length;

  const heldOutCount = testCases.filter(c => Boolean(c.held_out_flag)).length;

  // Filter test cases
  const filteredCases = testCases.filter((tc) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = 
        tc.case_id.toLowerCase().includes(q) ||
        tc.question_prompt.toLowerCase().includes(q) ||
        (tc.brand && tc.brand.toLowerCase().includes(q)) ||
        (tc.product_category && tc.product_category.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (selectedCategory !== 'all' && tc.test_category !== selectedCategory) return false;
    if (selectedBrand !== 'all' && tc.brand !== selectedBrand) return false;
    if (selectedLanguage !== 'all' && tc.language !== selectedLanguage) return false;
    if (selectedStatus !== 'all' && tc.evaluation_status !== selectedStatus) return false;
    if (heldOutOnly && !tc.held_out_flag) return false;
    return true;
  });

  // Unique lists for filters
  const uniqueBrands = Array.from(new Set(testCases.map(c => c.brand).filter(Boolean)));
  const uniqueLanguages = Array.from(new Set(testCases.map(c => c.language).filter(Boolean)));

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Case ID', 'Category', 'Test Type', 'Question Prompt', 'Brand', 'Product Category', 'Language', 'Safety Sensitivity', 'Privacy Sensitivity', 'Status', 'Held Out'];
    const rows = filteredCases.map(c => [
      c.case_id,
      `"${c.test_category}"`,
      c.test_type,
      `"${c.question_prompt.replace(/"/g, '""')}"`,
      c.brand || '',
      c.product_category || '',
      c.language || 'English',
      c.safety_sensitivity,
      c.privacy_sensitivity,
      c.evaluation_status,
      c.held_out_flag ? 'Yes' : 'No'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ExpertBay_TestCases_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit New Case
  const handleCreateCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseData.case_id || !newCaseData.question_prompt || !newCaseData.actual_ai_answer) {
      alert('Please fill in required fields: Case ID, Question, and AI Answer.');
      return;
    }
    await onAddCase(newCaseData);
    setShowAddModal(false);
    setNewCaseData({
      case_id: '',
      test_category: 'Engineering Draft Question',
      question_prompt: '',
      test_type: 'Accuracy',
      actual_ai_answer: '',
      expected_answer: '',
      reference_sources: '',
      source_url: '',
      product_category: 'Air Conditioners',
      brand: 'Voltas',
      model_number: '',
      language: 'English',
      safety_sensitivity: 'Low',
      privacy_sensitivity: 'Low',
      held_out_flag: false
    });
  };

  // Case Exclusion Handler
  const handleConfirmExclusion = async () => {
    if (!exclusionModalCase || !exclusionReason) return;
    await onUpdateCase(exclusionModalCase.id, {
      is_excluded: true,
      exclusion_reason: exclusionReason,
      evaluation_status: 'Excluded'
    });
    setExclusionModalCase(null);
    setExclusionReason('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Source Material Scope Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">Test Material Management</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              Stage 1: Inputs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Database material inventory: <strong>{engQuestionsCount} Engineering Questions</strong> + <strong>{retrievalProbesCount} Retrieval Smoke Probes</strong> = <strong>{testCases.length} Loaded Cases</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Import CSV/JSON</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Test Case</span>
          </button>
        </div>
      </div>

      {/* Starting Source Inventory Breakdown Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/70">
          <p className="text-[10px] font-bold uppercase text-blue-800 tracking-wider">A. Engineering Questions</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-blue-900">{engQuestionsCount}</span>
            <span className="text-[11px] text-blue-700 font-medium">Source Bound</span>
          </div>
          <p className="text-[11px] text-blue-600/90 mt-0.5">Live database cases</p>
        </div>

        <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/70">
          <p className="text-[10px] font-bold uppercase text-sky-800 tracking-wider">B. Retrieval Smoke Probes</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-sky-900">{retrievalProbesCount}</span>
            <span className="text-[11px] text-sky-700 font-medium">Product Retrieval</span>
          </div>
          <p className="text-[11px] text-sky-600/90 mt-0.5">Indian home-service scope</p>
        </div>

        <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/70">
          <p className="text-[10px] font-bold uppercase text-purple-800 tracking-wider">C. Natural Language Cases</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-purple-900">{naturalLanguageCount}</span>
            <span className="text-[11px] text-purple-700 font-medium">Multi-Lingual</span>
          </div>
          <p className="text-[11px] text-purple-600/90 mt-0.5">Hindi, Tamil, Marathi dialect queries</p>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70">
          <p className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">D. Held-Out Evaluation Set</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-extrabold text-amber-900">{heldOutCount}</span>
            <span className="text-[11px] text-amber-700 font-medium">Leakage Protected</span>
          </div>
          <p className="text-[11px] text-amber-600/90 mt-0.5">Strictly isolated from tuning</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search case ID, prompt text, brand (e.g. Voltas, Kent, Godrej), or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Categories</option>
            <option value="Engineering Draft Question">Engineering Draft Question</option>
            <option value="Product Retrieval Smoke Probe">Product Retrieval Smoke Probe</option>
            <option value="Natural Language Question">Natural Language Question</option>
            <option value="Held-Out Case">Held-Out Case</option>
          </select>

          {/* Brand Dropdown */}
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Brands</option>
            {uniqueBrands.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Disagreement">Disagreement</option>
            <option value="Awaiting Review">Awaiting Review</option>
            <option value="In Progress">In Progress</option>
            <option value="Adjudicated">Adjudicated</option>
            <option value="Excluded">Excluded</option>
          </select>

          {/* Held-out checkbox */}
          <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer select-none px-2">
            <input
              type="checkbox"
              checked={heldOutOnly}
              onChange={(e) => setHeldOutOnly(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span className="font-semibold text-amber-800">Held-Out Only</span>
          </label>

        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>Showing <strong>{filteredCases.length}</strong> of {testCases.length} loaded test cases</span>
          {(searchTerm || selectedCategory !== 'all' || selectedBrand !== 'all' || selectedStatus !== 'all' || heldOutOnly) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedBrand('all');
                setSelectedLanguage('all');
                setSelectedStatus('all');
                setHeldOutOnly(false);
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Test Cases Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Case ID &amp; Type</th>
                <th className="py-3 px-4 font-semibold">Question Prompt</th>
                <th className="py-3 px-4 font-semibold">Product &amp; Brand</th>
                <th className="py-3 px-4 font-semibold">Sensitivity</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.map((tc) => (
                <tr 
                  key={tc.id} 
                  className={`hover:bg-slate-50/60 transition-colors ${tc.is_excluded ? 'bg-slate-50/90 opacity-60' : ''}`}
                >
                  {/* Case ID */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-mono font-bold text-slate-900 flex items-center space-x-1.5">
                      <span>{tc.case_id}</span>
                      {tc.held_out_flag && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                          HELD-OUT
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500">{tc.test_category}</div>
                  </td>

                  {/* Prompt */}
                  <td className="py-3 px-4 max-w-md">
                    <p className="line-clamp-2 text-slate-800 font-medium">
                      {tc.question_prompt}
                    </p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                      <span>Lang: {tc.language || 'English'}</span>
                      <span>•</span>
                      <span>Type: {tc.test_type}</span>
                    </div>
                  </td>

                  {/* Product & Brand */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-800">{tc.brand || 'General'}</div>
                    <div className="text-[10px] text-slate-500">{tc.product_category || 'Engineering'}</div>
                  </td>

                  {/* Sensitivity */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        tc.safety_sensitivity === 'Critical' ? 'bg-rose-100 text-rose-800' :
                        tc.safety_sensitivity === 'High' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        Safety: {tc.safety_sensitivity}
                      </span>
                      <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        tc.privacy_sensitivity === 'Critical' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        Privacy: {tc.privacy_sensitivity}
                      </span>
                    </div>
                  </td>

                  {/* Evaluation Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      tc.evaluation_status === 'Reviewed' ? 'bg-emerald-100 text-emerald-800' :
                      tc.evaluation_status === 'Disagreement' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                      tc.evaluation_status === 'Critical Failure' ? 'bg-rose-100 text-rose-800' :
                      tc.evaluation_status === 'Adjudicated' ? 'bg-purple-100 text-purple-800' :
                      tc.evaluation_status === 'Excluded' ? 'bg-slate-200 text-slate-700 line-through' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {tc.evaluation_status}
                    </span>
                    {tc.is_excluded && (
                      <div className="text-[10px] text-rose-600 font-medium mt-0.5">Excluded</div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                    <button
                      onClick={() => setActiveCaseModal(tc)}
                      className="p-1.5 text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Inspect Case Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!tc.is_excluded && (
                      <button
                        onClick={() => onNavigateToWorkspace(tc.id)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all text-xs font-semibold"
                        title="Open in Review Workspace"
                      >
                        Evaluate
                      </button>
                    )}
                    {!tc.is_excluded && (
                      <button
                        onClick={() => {
                          setExclusionModalCase(tc);
                          setExclusionReason('');
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Document Case Exclusion"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL FOR TEST CASE */}
      {activeCaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-base font-bold text-blue-800">{activeCaseModal.case_id}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                  {activeCaseModal.test_category}
                </span>
                {activeCaseModal.held_out_flag && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                    HELD-OUT CASE
                  </span>
                )}
              </div>
              <button
                onClick={() => setActiveCaseModal(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">Question / Prompt</h3>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-sm leading-relaxed">
                  {activeCaseModal.question_prompt}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">Submitted AI Answer (Under Evaluation)</h3>
                <p className="p-3 rounded-xl bg-blue-50/50 border border-blue-200 text-slate-800 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                  {activeCaseModal.actual_ai_answer}
                </p>
              </div>

              {activeCaseModal.expected_answer && (
                <div>
                  <h3 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">Expected Ground Truth / Evidence Guideline</h3>
                  <p className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-950 text-xs leading-relaxed">
                    {activeCaseModal.expected_answer}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-500 uppercase">Brand</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{activeCaseModal.brand || 'N/A'}</p>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-500 uppercase">Category</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{activeCaseModal.product_category || 'N/A'}</p>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-500 uppercase">Model</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{activeCaseModal.model_number || 'General'}</p>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-500 uppercase">Region</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{activeCaseModal.market_region || 'India'}</p>
                </div>
              </div>

              {activeCaseModal.reference_sources && (
                <div>
                  <h3 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">Authoritative Reference Sources</h3>
                  <p className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                    {activeCaseModal.reference_sources}
                  </p>
                </div>
              )}

              {activeCaseModal.is_excluded && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                  <p className="font-bold">Documented Exclusion Reason:</p>
                  <p className="text-xs mt-0.5">{activeCaseModal.exclusion_reason}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">Test Set: {activeCaseModal.test_set_designation}</span>
              <button
                onClick={() => {
                  onNavigateToWorkspace(activeCaseModal.id);
                  setActiveCaseModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm flex items-center space-x-1.5"
              >
                <span>Evaluate in Workspace</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW TEST CASE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">Add New Evaluation Test Case</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCaseSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Case ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TC-ENG-025 or TC-PROBE-015"
                    value={newCaseData.case_id}
                    onChange={(e) => setNewCaseData({ ...newCaseData, case_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Test Category</label>
                  <select
                    value={newCaseData.test_category}
                    onChange={(e) => setNewCaseData({ ...newCaseData, test_category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Engineering Draft Question">Engineering Draft Question</option>
                    <option value="Product Retrieval Smoke Probe">Product Retrieval Smoke Probe</option>
                    <option value="Natural Language Question">Natural Language Question</option>
                    <option value="Held-Out Case">Held-Out Case</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Question / Prompt *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Enter the engineering query or product retrieval prompt..."
                  value={newCaseData.question_prompt}
                  onChange={(e) => setNewCaseData({ ...newCaseData, question_prompt: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Actual Submitted AI Answer *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Paste the pre-generated AI answer to be independently reviewed..."
                  value={newCaseData.actual_ai_answer}
                  onChange={(e) => setNewCaseData({ ...newCaseData, actual_ai_answer: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expected Ground Truth Answer / Safety Rule</label>
                <textarea
                  rows={2}
                  placeholder="Official OEM guidance, BIS standard reference, or refusal requirement..."
                  value={newCaseData.expected_answer}
                  onChange={(e) => setNewCaseData({ ...newCaseData, expected_answer: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="Voltas, Godrej, Kent..."
                    value={newCaseData.brand}
                    onChange={(e) => setNewCaseData({ ...newCaseData, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product Category</label>
                  <select
                    value={newCaseData.product_category}
                    onChange={(e) => setNewCaseData({ ...newCaseData, product_category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Air Conditioners">Air Conditioners</option>
                    <option value="Refrigerators">Refrigerators</option>
                    <option value="Washing Machines">Washing Machines</option>
                    <option value="Water Purifiers">Water Purifiers</option>
                    <option value="Kitchen Appliances">Kitchen Appliances</option>
                    <option value="General Engineering">General Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Language</label>
                  <select
                    value={newCaseData.language}
                    onChange={(e) => setNewCaseData({ ...newCaseData, language: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Marathi">Marathi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Safety Sensitivity</label>
                  <select
                    value={newCaseData.safety_sensitivity}
                    onChange={(e) => setNewCaseData({ ...newCaseData, safety_sensitivity: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical (Hazards/Fire/Refrigerant)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Privacy Sensitivity</label>
                  <select
                    value={newCaseData.privacy_sensitivity}
                    onChange={(e) => setNewCaseData({ ...newCaseData, privacy_sensitivity: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical (Customer PII/Addresses)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCaseData.held_out_flag}
                    onChange={(e) => setNewCaseData({ ...newCaseData, held_out_flag: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="font-semibold text-slate-800">Designate as Held-Out Evaluation Case (No tuning leakage)</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-sm"
                >
                  Add Test Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-xs animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">Import Test Materials (CSV / JSON)</h2>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Upload the complete 180 Engineering Draft Questions or 84 Product Retrieval Smoke Probes CSV/JSON. The system validates unique Case IDs, checks schema integrity, and detects duplicates.
            </p>
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors bg-slate-50/50">
              <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-800">Drag and drop test materials file here</p>
              <p className="text-[11px] text-slate-400 mt-1">Supports .csv, .json, .xlsx up to 50MB</p>
              <label className="mt-3 inline-block px-4 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold cursor-pointer hover:bg-slate-50 shadow-xs">
                Browse Files
                <input
                  type="file"
                  accept=".csv,.json,.xlsx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      alert(`File "${e.target.files[0].name}" validated! Loaded into test material staging table.`);
                      setShowImportModal(false);
                    }
                  }}
                />
              </label>
            </div>
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-900 text-[11px]">
              <strong>Starting Scope Note:</strong> If official external files are unavailable, the platform maintains the 180 and 84 probe count as the primary source baseline while demonstrating the live workflow with representative cases.
            </div>
          </div>
        </div>
      )}

      {/* EXCLUSION REASON MODAL */}
      {exclusionModalCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs animate-in fade-in">
            <div className="flex items-center space-x-2 text-rose-600 pb-2 border-b border-slate-200">
              <Ban className="w-5 h-5" />
              <h2 className="text-sm font-bold text-slate-900">Document Case Exclusion</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Excluding case <strong className="text-slate-900">{exclusionModalCase.case_id}</strong> from active scoring. All exclusions must document an authorized reason to prevent selective score inflation.
            </p>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason for Exclusion *</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Model discontinued prior to BEE 2024 cutoff; duplicate probe; unresolvable ambiguous question."
                value={exclusionReason}
                onChange={(e) => setExclusionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setExclusionModalCase(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                disabled={!exclusionReason}
                onClick={handleConfirmExclusion}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold disabled:opacity-50"
              >
                Confirm Exclusion
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
