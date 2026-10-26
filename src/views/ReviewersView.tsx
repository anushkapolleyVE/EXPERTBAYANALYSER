import React, { useState } from 'react';
import { 
  Users, UserCheck, ShieldCheck, ShieldAlert, AlertTriangle, 
  CheckCircle2, Plus, Eye, Check, X, Award, Globe, 
  Cpu, Wrench, Search, Filter, FileText, ChevronRight
} from 'lucide-react';
import { Reviewer } from '../types';

interface ReviewersViewProps {
  reviewers: Reviewer[];
  onNominateReviewer: (reviewer: Partial<Reviewer>) => Promise<void>;
  onVerifyReviewer: (id: number | string, verifyData: any) => Promise<void>;
}

export const ReviewersView: React.FC<ReviewersViewProps> = ({
  reviewers,
  onNominateReviewer,
  onVerifyReviewer
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'technical' | 'domain'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReviewer, setSelectedReviewer] = useState<Reviewer | null>(null);
  const [showNominateModal, setShowNominateModal] = useState(false);
  const [verificationModalReviewer, setVerificationModalReviewer] = useState<Reviewer | null>(null);

  // Verification Form State
  const [verifyStatus, setVerifyStatus] = useState<string>('Approved');
  const [qualVerified, setQualVerified] = useState<boolean>(true);
  const [qualNotes, setQualNotes] = useState<string>('');
  const [indepVerified, setIndepVerified] = useState<boolean>(true);
  const [indepNotes, setIndepNotes] = useState<string>('');
  const [coiDecision, setCoiDecision] = useState<string>('Approved - Confirmed independent');

  // New Nomination Form State
  const [newNomination, setNewNomination] = useState<Partial<Reviewer>>({
    reviewer_id: '',
    full_name: '',
    reviewer_type: 'Home-Service Domain Reviewer',
    email: '',
    professional_profile: '',
    work_experience: '',
    years_experience: 5,
    credentials: '',
    technical_skills: '',
    product_categories: JSON.stringify(['Air Conditioners']),
    brands_covered: JSON.stringify(['Voltas', 'Blue Star']),
    models_covered: '',
    language_coverage: JSON.stringify([{ language: 'Hindi', proficiency: 'Native', reading: true, technical_docs: true, eval_capability: true }]),
    india_market_coverage: JSON.stringify({ regions: ['North India'], regulatory_standards: 'BIS IS 1391' }),
    official_guidance_familiarity: 'High',
    regulator_guidance_familiarity: 'High',
    hourly_rate: '$65/hr',
    conflict_of_interest_disclosed: true,
    coi_has_disqualifying_conflict: false,
    coi_mitigation_decision: 'Nominated - Verification Pending'
  });

  const filteredReviewers = reviewers.filter((r) => {
    if (activeTab === 'technical' && !r.reviewer_type.includes('Technical')) return false;
    if (activeTab === 'domain' && !r.reviewer_type.includes('Domain')) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = 
        r.full_name.toLowerCase().includes(q) ||
        r.reviewer_id.toLowerCase().includes(q) ||
        r.reviewer_type.toLowerCase().includes(q) ||
        (r.product_categories && r.product_categories.toLowerCase().includes(q)) ||
        (r.technical_skills && r.technical_skills.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Handle Nomination Submit
  const handleNominationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNomination.full_name || !newNomination.email) {
      alert('Please fill in candidate name and email.');
      return;
    }
    const autoId = newNomination.reviewer_id || (
      newNomination.reviewer_type?.includes('Technical')
        ? `DEMO-TECH-${String(reviewers.length + 1).padStart(3, '0')}`
        : `DEMO-DOMAIN-${String(reviewers.length + 1).padStart(3, '0')}`
    );

    await onNominateReviewer({
      ...newNomination,
      reviewer_id: autoId,
      verification_status: 'Nominated',
      qualification_verified: false,
      independence_verified: false
    });
    setShowNominateModal(false);
  };

  // Handle Verification Submit
  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationModalReviewer) return;
    await onVerifyReviewer(verificationModalReviewer.id, {
      verification_status: verifyStatus,
      qualification_verified: qualVerified,
      qualification_notes: qualNotes || 'Credentials reviewed and accepted.',
      independence_verified: indepVerified,
      independence_notes: indepNotes || 'No implementation or answer authorship conflicts identified.',
      coi_mitigation_decision: coiDecision
    });
    setVerificationModalReviewer(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">Reviewer Management &amp; Nominations</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200">
              Stage 3: Reviewers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Two distinct reviewer capabilities with mandatory qualification and independence verification gates.
          </p>
        </div>

        <button
          onClick={() => setShowNominateModal(true)}
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-colors flex items-center space-x-1.5 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nominate Candidate</span>
        </button>
      </div>

      {/* Two Capabilities Architecture Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Capability 1: Technical / AI Reviewer */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-slate-50 border border-blue-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                <Cpu className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-blue-950">Reviewer Type 1: Technical / AI Reviewer</h2>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-900 font-bold">
              Engineering Expertise
            </span>
          </div>
          <p className="text-xs text-blue-900/80 leading-relaxed">
            Must possess hands-on expertise in <strong>Python, FastAPI, React, PostgreSQL</strong>, retrieval quality assessment (nDCG, Recall@k), and privacy engineering.
          </p>
          <div className="p-2.5 rounded-xl bg-white/80 border border-blue-100 text-[11px] text-slate-700 space-y-1">
            <div className="flex items-center space-x-1.5 font-semibold text-blue-900">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Strict Independence Gate:</span>
            </div>
            <p className="text-slate-600">
              Zero participation in implementing the evaluated system, model training, or authoring submitted answers.
            </p>
          </div>
        </div>

        {/* Capability 2: Home-Service Domain Reviewer */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/80 to-slate-50 border border-purple-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-purple-600 text-white">
                <Wrench className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-purple-950">Reviewer Type 2: Home-Service Domain Reviewer</h2>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-900 font-bold">
              India Market Scope
            </span>
          </div>
          <p className="text-xs text-purple-900/80 leading-relaxed">
            Assessed individually for <strong>product category coverage</strong> (ACs, Refrigerators, Water Purifiers, Washing Machines), official manufacturer &amp; regulator guidance (BEE, BIS), and regional language skills.
          </p>
          <div className="p-2.5 rounded-xl bg-white/80 border border-purple-100 text-[11px] text-slate-700 space-y-1">
            <div className="flex items-center space-x-1.5 font-semibold text-purple-900">
              <Globe className="w-3.5 h-3.5 text-purple-600" />
              <span>Explicit Language &amp; Brand Coverage:</span>
            </div>
            <p className="text-slate-600">
              Actual brand (Voltas, Kent, Godrej, IFB) and language capabilities (Hindi, Tamil, Marathi) must be stated clearly with verified credentials.
            </p>
          </div>
        </div>

      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Reviewers ({reviewers.length})
          </button>
          <button
            onClick={() => setActiveTab('technical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'technical' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-blue-700'
            }`}
          >
            Type 1: Technical / AI
          </button>
          <button
            onClick={() => setActiveTab('domain')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'domain' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-purple-700'
            }`}
          >
            Type 2: Home-Service Domain
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search reviewer by name, skill, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Reviewer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReviewers.map((rev) => {
          const isTech = rev.reviewer_type.includes('Technical');
          let parsedSkills: string[] = [];
          try {
            if (rev.technical_skills) parsedSkills = JSON.parse(rev.technical_skills);
          } catch (e) {
            if (rev.technical_skills) parsedSkills = rev.technical_skills.split(',');
          }

          let parsedCategories: string[] = [];
          try {
            if (rev.product_categories) parsedCategories = JSON.parse(rev.product_categories);
          } catch (e) {}

          let parsedLanguages: any[] = [];
          try {
            if (rev.language_coverage) parsedLanguages = JSON.parse(rev.language_coverage);
          } catch (e) {}

          return (
            <div 
              key={rev.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all space-y-4"
            >
              <div>
                {/* Header: ID, Badge, Verification */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-500">{rev.reviewer_id}</span>
                    <h2 className="text-base font-bold text-slate-900 mt-0.5">{rev.full_name}</h2>
                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                      isTech ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {rev.reviewer_type}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    rev.verification_status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                    rev.verification_status === 'Verified' ? 'bg-blue-100 text-blue-800' :
                    rev.verification_status === 'Under Review' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {rev.verification_status}
                  </span>
                </div>

                {/* Profile snippet */}
                <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                  {rev.professional_profile}
                </p>

                {/* Distinct Verification Gates */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">1. Qualification Verified:</span>
                    <span className={`font-semibold flex items-center space-x-1 text-[11px] ${
                      rev.qualification_verified ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      {rev.qualification_verified ? <CheckCircle2 className="w-3.5 h-3.5 mr-0.5" /> : <AlertTriangle className="w-3.5 h-3.5 mr-0.5" />}
                      <span>{rev.qualification_verified ? 'Verified' : 'Pending Check'}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">2. Independence Verified:</span>
                    <span className={`font-semibold flex items-center space-x-1 text-[11px] ${
                      rev.independence_verified ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {rev.independence_verified ? <CheckCircle2 className="w-3.5 h-3.5 mr-0.5" /> : <ShieldAlert className="w-3.5 h-3.5 mr-0.5" />}
                      <span>{rev.independence_verified ? 'No COI / Independent' : 'Audit Required'}</span>
                    </span>
                  </div>
                </div>

                {/* Skills / Categories Matrix */}
                <div className="mt-3 space-y-2 text-xs">
                  {isTech && parsedSkills.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Technical Skills</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {parsedSkills.slice(0, 4).map((sk, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                            {sk}
                          </span>
                        ))}
                        {parsedSkills.length > 4 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                            +{parsedSkills.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {!isTech && (
                    <div className="space-y-1.5">
                      {parsedCategories.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Categories</span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {parsedCategories.map((cat, idx) => (
                              <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium border border-purple-100">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {parsedLanguages.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Language Capabilities</span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {parsedLanguages.map((lang, idx) => (
                              <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-medium border border-emerald-100">
                                {lang.language} ({lang.proficiency})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => setSelectedReviewer(rev)}
                  className="text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Full Profile &amp; COI</span>
                </button>

                <button
                  onClick={() => {
                    setVerificationModalReviewer(rev);
                    setVerifyStatus(rev.verification_status);
                    setQualVerified(rev.qualification_verified);
                    setIndepVerified(rev.independence_verified);
                    setCoiDecision(rev.coi_mitigation_decision || 'Approved');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white transition-colors text-slate-700 font-semibold"
                >
                  Audit / Verify
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FULL PROFILE & CONFLICT OF INTEREST MODAL */}
      {selectedReviewer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-blue-700">{selectedReviewer.reviewer_id}</span>
                <h2 className="text-sm font-bold text-slate-900">{selectedReviewer.full_name}</h2>
              </div>
              <button onClick={() => setSelectedReviewer(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">Professional Background</h3>
                <p className="text-slate-800 text-xs leading-relaxed p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {selectedReviewer.professional_profile}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-500 uppercase">Experience</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedReviewer.years_experience} Years</p>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-500 uppercase">Hourly Rate</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedReviewer.hourly_rate}</p>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                  <span className="text-[10px] text-slate-500 uppercase">Availability</span>
                  <p className="font-semibold text-emerald-700 mt-0.5">{selectedReviewer.availability_status}</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">Credentials &amp; Certifications</h3>
                <p className="text-slate-800 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  {selectedReviewer.credentials}
                </p>
              </div>

              {/* Conflict of Interest Section (Mandatory Requirement) */}
              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2">
                <div className="flex items-center space-x-2 text-purple-950 font-bold">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span>Conflict of Interest Disclosure Record</span>
                </div>
                <p className="text-purple-900 text-[11px] leading-relaxed">
                  Independent review mandate: Reviewer has formally declared zero prior involvement in model implementation, training prompt creation, or authoring submitted evaluation answers.
                </p>
                <div className="pt-2 border-t border-purple-200/60 text-[11px] text-purple-950 font-medium">
                  <strong>Mitigation Decision:</strong> {selectedReviewer.coi_mitigation_decision || 'Approved without disqualifying conflicts.'}
                </div>
              </div>

              {/* Qualification Evidence */}
              {selectedReviewer.qualification_evidence && (
                <div>
                  <h3 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">Verified Audit Evidence</h3>
                  <p className="text-slate-700 p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px]">
                    {selectedReviewer.qualification_evidence}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedReviewer(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERIFY / AUDIT MODAL */}
      {verificationModalReviewer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-900">
                Audit Reviewer: {verificationModalReviewer.full_name}
              </h2>
              <button onClick={() => setVerificationModalReviewer(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerificationSubmit} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Candidate Status Gate</label>
                <select
                  value={verifyStatus}
                  onChange={(e) => setVerifyStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Nominated">Nominated</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Verification Pending">Verification Pending</option>
                  <option value="Verified">Verified</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qualVerified}
                    onChange={(e) => setQualVerified(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="font-semibold text-slate-800">1. Qualifications Explicitly Verified</span>
                </label>
                <input
                  type="text"
                  placeholder="Verification note (e.g. OEM certificate # verified)"
                  value={qualNotes}
                  onChange={(e) => setQualNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={indepVerified}
                    onChange={(e) => setIndepVerified(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="font-semibold text-slate-800">2. Independence Confirmed (No Implementation Role)</span>
                </label>
                <input
                  type="text"
                  placeholder="Independence audit note (zero prior consulting with ExpertBay AI team)"
                  value={indepNotes}
                  onChange={(e) => setIndepNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Conflict-of-Interest Decision</label>
                <input
                  type="text"
                  value={coiDecision}
                  onChange={(e) => setCoiDecision(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setVerificationModalReviewer(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Save Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOMINATE CANDIDATE MODAL */}
      {showNominateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">Nominate Independent Evaluation Candidate</h2>
              <button onClick={() => setShowNominateModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleNominationSubmit} className="p-6 overflow-y-auto space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Candidate full name"
                    value={newNomination.full_name}
                    onChange={(e) => setNewNomination({ ...newNomination, full_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="evaluator@demo.org"
                    value={newNomination.email}
                    onChange={(e) => setNewNomination({ ...newNomination, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Capability Type *</label>
                <select
                  value={newNomination.reviewer_type}
                  onChange={(e) => setNewNomination({ ...newNomination, reviewer_type: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Technical / AI Evaluation Reviewer">Type 1: Technical / AI Evaluation Reviewer</option>
                  <option value="Home-Service Domain Reviewer">Type 2: Home-Service Domain Reviewer</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Professional Profile &amp; Experience Summary *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Outline years in field, certified service centers, or RAG evaluation experience..."
                  value={newNomination.professional_profile}
                  onChange={(e) => setNewNomination({ ...newNomination, professional_profile: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credentials</label>
                  <input
                    type="text"
                    placeholder="e.g. CIPT, BEE Technician, BIS Auditor"
                    value={newNomination.credentials}
                    onChange={(e) => setNewNomination({ ...newNomination, credentials: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hourly / Project Rate</label>
                  <input
                    type="text"
                    value={newNomination.hourly_rate}
                    onChange={(e) => setNewNomination({ ...newNomination, hourly_rate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* COI Checkbox */}
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200">
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newNomination.conflict_of_interest_disclosed}
                    onChange={(e) => setNewNomination({ ...newNomination, conflict_of_interest_disclosed: e.target.checked })}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 h-4 w-4 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-purple-950">Confirm COI Non-Involvement Declaration</span>
                    <p className="text-[11px] text-purple-800 mt-0.5">
                      Candidate explicitly declares no authorship of ExpertBay AI models, prompts, or evaluated answers.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNominateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Submit Nomination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
