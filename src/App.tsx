/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { JobPosting, StudentUser, FilterOptions, EligibleBranch, CareerQuizPreferences } from './types';
import { INITIAL_JOBS } from './data/mockJobs';
import { LandingAuthPage } from './components/LandingAuthPage';
import { ChatGptCareerQuiz } from './components/ChatGptCareerQuiz';
import { Navbar } from './components/Navbar';
import { JobFilters } from './components/JobFilters';
import { JobCard } from './components/JobCard';
import { JobDetailModal } from './components/JobDetailModal';
import { PostJobModal } from './components/PostJobModal';
import { ReviewsSection } from './components/ReviewsSection';
import { AiSkillMatcher } from './components/AiSkillMatcher';
import { PoliciesAndFounderModal } from './components/PoliciesAndFounderModal';
import { 
  ShieldCheck, 
  Sparkles, 
  Briefcase, 
  Users, 
  Award, 
  ExternalLink, 
  CheckCircle2,
  Mail,
  Bot,
  SlidersHorizontal,
  X
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<StudentUser | null>(null);
  const [showQuiz, setShowQuiz] = useState<boolean>(false);
  const [quizPreferences, setQuizPreferences] = useState<CareerQuizPreferences | null>(null);

  const [currentTab, setCurrentTab] = useState<'jobs' | 'ai-matcher' | 'reviews'>('jobs');
  const [jobs, setJobs] = useState<JobPosting[]>(INITIAL_JOBS);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [isPoliciesModalOpen, setIsPoliciesModalOpen] = useState(false);
  const [policiesModalTab, setPoliciesModalTab] = useState<'policies' | 'founder'>('policies');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Restore stored session and quiz state
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('s2c_student_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      }
      const savedQuiz = localStorage.getItem('s2c_quiz_prefs');
      if (savedQuiz) {
        setQuizPreferences(JSON.parse(savedQuiz));
      }
    } catch (err) {
      console.error('Session load error', err);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Filter State
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    roleType: 'All',
    opportunityType: 'All',
    location: 'All Locations',
    selectedBranch: 'All',
    certificateOnly: false,
    minVacancies: 0,
  });

  const handleLoginSuccess = (user: StudentUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('s2c_student_user', JSON.stringify(user));
    } catch (err) {
      console.error(err);
    }
    // Launch conversational ChatGPT-style quiz upon successful login
    setShowQuiz(true);
    showToast(`Welcome ${user.name}! Let's personalize your fresher opportunities.`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowQuiz(false);
    setQuizPreferences(null);
    try {
      localStorage.removeItem('s2c_student_user');
      localStorage.removeItem('s2c_quiz_prefs');
    } catch (err) {
      console.error(err);
    }
    showToast('Signed out successfully.');
  };

  // When user finishes the ChatGPT-style quiz
  const handleQuizComplete = (prefs: CareerQuizPreferences) => {
    setQuizPreferences(prefs);
    try {
      localStorage.setItem('s2c_quiz_prefs', JSON.stringify(prefs));
    } catch (err) {
      console.error(err);
    }

    // Automatically apply quiz answers to filters
    setFilters((prev) => ({
      ...prev,
      roleType: prefs.roleType,
      opportunityType: prefs.opportunityType,
      location: prefs.location,
      certificateOnly: prefs.certificateRequired,
      selectedBranch: currentUser ? currentUser.branch : 'All',
    }));

    setShowQuiz(false);
    setCurrentTab('jobs');
    showToast('Dashboard filtered based on your quiz answers!');
  };

  const handleSkipQuiz = () => {
    setShowQuiz(false);
    setCurrentTab('jobs');
  };

  const handleClearQuizPreferences = () => {
    setQuizPreferences(null);
    try {
      localStorage.removeItem('s2c_quiz_prefs');
    } catch (e) {
      console.error(e);
    }
    setFilters({
      searchQuery: '',
      roleType: 'All',
      opportunityType: 'All',
      location: 'All Locations',
      selectedBranch: currentUser ? currentUser.branch : 'All',
      certificateOnly: false,
      minVacancies: 0,
    });
    showToast('Reset to all verified fresher roles.');
  };

  // Filtered Jobs Computation
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Search query filter
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesCompany = job.company.toLowerCase().includes(q);
        const matchesSkills = job.keySkills.some((s) => s.toLowerCase().includes(q));
        const matchesDesc = job.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCompany && !matchesSkills && !matchesDesc) {
          return false;
        }
      }

      // Role type filter (Technical vs Non-Technical)
      if (filters.roleType !== 'All' && job.roleType !== filters.roleType) {
        return false;
      }

      // Opportunity type filter (Internship with PPO vs Direct Placement)
      if (filters.opportunityType !== 'All' && job.opportunityType !== filters.opportunityType) {
        return false;
      }

      // Location filter
      if (filters.location !== 'All Locations') {
        if (!job.location.toLowerCase().includes(filters.location.toLowerCase())) {
          return false;
        }
      }

      // Branch filter (Strict CSE, AIDS, IT, EC, Data Science check)
      if (filters.selectedBranch !== 'All') {
        if (!job.targetBranches.includes(filters.selectedBranch)) {
          return false;
        }
      }

      // Certificate of Completion filter
      if (filters.certificateOnly && !job.hasCertificateOfCompletion) {
        return false;
      }

      return true;
    });
  }, [jobs, filters]);

  const handleApplyIndeed = (job: JobPosting) => {
    window.open(job.indeedUrl, '_blank', 'noopener,noreferrer');
    showToast(`Redirecting to Indeed for ${job.title} at ${job.company}`);
  };

  const handleJobCreated = (newJob: JobPosting) => {
    setJobs([newJob, ...jobs]);
    showToast(`Opportunity verified & published! (Ref: ${newJob.indeedJobId})`);
  };

  const openPolicies = (tab: 'policies' | 'founder' = 'policies') => {
    setPoliciesModalTab(tab);
    setIsPoliciesModalOpen(true);
  };

  // 1. Initial State: Landing & Authentication View (no founder details or policies on this first page)
  if (!currentUser) {
    return (
      <>
        <LandingAuthPage
          onLoginSuccess={handleLoginSuccess}
          onOpenPoliciesModal={() => openPolicies('policies')}
        />
        <PoliciesAndFounderModal
          isOpen={isPoliciesModalOpen}
          onClose={() => setIsPoliciesModalOpen(false)}
          defaultTab={policiesModalTab}
        />
      </>
    );
  }

  // 2. Pre-Dashboard Filter: ChatGPT-Style Interactive MCQ Quiz
  if (showQuiz) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
        <header className="border-b border-slate-200 bg-white/95 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              S2C
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-base">
              SKILL2CAREER
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-600 font-medium">
              Student: <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.branch})
            </span>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-600 font-medium underline transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="flex-1">
          <ChatGptCareerQuiz
            currentUser={currentUser}
            onQuizComplete={handleQuizComplete}
            onSkip={handleSkipQuiz}
          />
        </main>
      </div>
    );
  }

  // 3. Main Dashboard View
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Top Navbar adhering to Top Bar contract */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenPostJob={() => setIsPostJobOpen(true)}
        onRetakeQuiz={() => setShowQuiz(true)}
        onOpenPolicies={() => openPolicies('founder')}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'jobs' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            
            {/* Quiz Preference Banner if active */}
            {quizPreferences && (
              <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-600 text-white rounded-lg shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-indigo-950 flex items-center gap-2">
                      <span>Quiz Recommendations Applied</span>
                      <span className="text-[10px] bg-indigo-200/80 text-indigo-800 px-2 py-0.5 rounded-full font-mono">
                        {currentUser.branch} Stream
                      </span>
                    </div>
                    <div className="text-xs text-indigo-800 mt-0.5">
                      Filtered for: <strong>{quizPreferences.roleType}</strong> roles ·{' '}
                      <strong>{quizPreferences.opportunityType}</strong> ·{' '}
                      <strong>{quizPreferences.location}</strong>
                      {quizPreferences.certificateRequired && ' · Certificate Required'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowQuiz(true)}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                  >
                    Tweak Quiz Answers
                  </button>
                  <button
                    onClick={handleClearQuizPreferences}
                    className="text-xs text-slate-500 hover:text-slate-800 p-1.5 transition-colors"
                    title="Clear quiz filters and show all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Dashboard Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 tracking-wide uppercase">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>100% Genuine · Freshers Only (0-Exp)</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                  Fresher Jobs & Internships Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Pre-filtered for {currentUser.branch} undergraduates with verified company emails & Indeed application links.
                </p>
              </div>
            </div>

            {/* Structured Job Filters */}
            <JobFilters
              filters={filters}
              setFilters={setFilters}
              totalJobsCount={jobs.length}
              filteredJobsCount={filteredJobs.length}
            />

            {/* Listings Grid */}
            {filteredJobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-2xs my-8">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  No Verified Roles Match This Specific Combination
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Try broadening your location, role format, or retaking the quick career questionnaire.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={handleClearQuizPreferences}
                    className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    Reset All Filters
                  </button>
                  <button
                    onClick={() => setShowQuiz(true)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    Retake Quiz
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onSelect={(j) => setSelectedJob(j)}
                    onApplyIndeed={handleApplyIndeed}
                  />
                ))}
              </div>
            )}

            {/* Trust Audit Footnote */}
            <div className="mt-12 bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-emerald-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Anti-Fake Listing Guarantee</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Strictly Verified Corporate Domains & 0-Exp Rules
                </h3>
                <p className="text-xs text-slate-500 max-w-xl">
                  Every company email is authenticated against fraudulent free domains. No placement fees or hidden training packages are permitted.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <a
                  href="mailto:contact@skill2career.com?subject=Listing%20Verification%20Report"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Report An Issue</span>
                </a>
                <button
                  onClick={() => openPolicies('policies')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Verification Rules
                </button>
              </div>
            </div>

          </div>
        )}

        {currentTab === 'ai-matcher' && (
          <AiSkillMatcher
            jobs={jobs}
            onSelectJob={(j) => setSelectedJob(j)}
          />
        )}

        {currentTab === 'reviews' && (
          <ReviewsSection
            currentUser={currentUser}
            onOpenAuth={() => {}}
          />
        )}
      </main>

      {/* Modals */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          currentUser={currentUser}
          onClose={() => setSelectedJob(null)}
          onOpenAuth={() => {}}
        />
      )}

      <PostJobModal
        isOpen={isPostJobOpen}
        onClose={() => setIsPostJobOpen(false)}
        onJobCreated={handleJobCreated}
      />

      <PoliciesAndFounderModal
        isOpen={isPoliciesModalOpen}
        onClose={() => setIsPoliciesModalOpen(false)}
        defaultTab={policiesModalTab}
      />

      {/* Clean Dashboard Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-slate-900">SKILL2CAREER</span>
            <span className="text-slate-300">·</span>
            <span className="italic text-indigo-600 font-medium">"Learn. Practice. Get Hired."</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => openPolicies('policies')}
              className="text-slate-500 hover:text-slate-900 hover:underline"
            >
              Policies & Terms
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => openPolicies('founder')}
              className="text-slate-500 hover:text-slate-900 hover:underline"
            >
              About Platform Founder
            </button>
            <span className="text-slate-300">·</span>
            <span>Exclusively for CSE · AIDS · IT · EC · Data Science</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
