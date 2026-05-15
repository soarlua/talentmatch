'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { JobInputSection } from '@/components/job-input-section';
import { ProcessingState } from '@/components/processing-state';
import { ResultsTable } from '@/components/results-table';
import { sampleJobDescription, type CandidateMatch, type JobDescription } from '@/lib/types';
import { talentMatchApi, parseJobDescription, ApiError } from '@/lib/api';
import { Sparkles, BrainCircuit } from 'lucide-react';

const CandidateDetailsPanel = dynamic(
  () => import('@/components/candidate-details-panel').then(mod => mod.CandidateDetailsPanel),
  { ssr: false }
);

type AppState = 'input' | 'processing' | 'results';

export default function TalentMatchPage() {
  const [appState, setAppState] = useState<AppState>('input');
  const [jobDescription, setJobDescription] = useState('');
  const [parsedJob, setParsedJob] = useState<JobDescription | null>(null);
  const [candidates, setCandidates] = useState<CandidateMatch[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateMatch | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunMatching = useCallback(async (mode: 'json' | 'text') => {
    setError(null);
    
    let parsed: JobDescription;
    
    if (mode === 'json') {
      try {
        parsed = parseJobDescription(jobDescription);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse job description JSON');
        return;
      }
    } else {
      // For plaintext, we create a simplified JobDescription 
      // In a real app, the backend would use LLM to extract these
      parsed = {
        job_title: "Analyzed Requirements",
        requirements: [{ skill: jobDescription.substring(0, 100), priority: "mandatory" }],
        experience: { years: 0, priority: "optional" },
        extras: []
      };
    }

    setParsedJob(parsed);
    setAppState('processing');
    
    try {
      const response = await talentMatchApi.match(parsed);
      const sortedCandidates = [...response.candidates].sort(
        (a, b) => b.matchScore - a.matchScore
      );
      setCandidates(sortedCandidates);
      setAppState('results');
    } catch (err) {
      setAppState('input');
      if (err instanceof ApiError) {
        setError(`API Error (${err.status}): ${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    }
  }, [jobDescription]);

  const handleViewProfile = useCallback((candidate: CandidateMatch) => {
    setSelectedCandidate(candidate);
    setIsDetailsOpen(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setIsDetailsOpen(false);
    setSelectedCandidate(null);
  }, []);

  const handleReset = useCallback(() => {
    setAppState('input');
    setJobDescription('');
    setParsedJob(null);
    setCandidates([]);
    setError(null);
  }, []);

  const requiredExperience = useMemo(() => 
    parsedJob?.experience.years ?? sampleJobDescription.experience.years,
    [parsedJob]
  );

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      {/* Navigation */}
      <header className="border-b border-border/40 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-xl bg-[#A100FF] shadow-lg shadow-purple-500/20">
                <BrainCircuit className="size-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-foreground tracking-tight block leading-none">
                  TalentMatch AI
                </span>
                <span className="text-[10px] font-bold text-[#A100FF] uppercase tracking-wider">
                  Enterprise Matching
                </span>
              </div>
            </div>
            {appState === 'results' && (
              <button
                onClick={handleReset}
                className="text-sm font-semibold text-muted-foreground hover:text-[#A100FF] transition-colors flex items-center gap-2"
              >
                New Analysis
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-border/40 py-16 sm:py-24">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] size-[40%] bg-purple-100/50 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] size-[40%] bg-blue-50/50 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-[#A100FF] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="size-3" />
              Next-Gen Recruitment
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0F172A] tracking-tight text-balance leading-[1.1]">
              Match the Best Talent <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A100FF] to-[#2563EB]">with AI Precision</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto text-balance font-medium leading-relaxed">
              Bridge the gap between requirements and candidates instantly. Our AI analyzes multi-dimensional data points to rank the perfect matches for your team.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col gap-12">
          {appState === 'input' && (
            <div className="max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
              <JobInputSection
                jobDescription={jobDescription}
                onJobDescriptionChange={setJobDescription}
                onRunMatching={handleRunMatching}
                isProcessing={false}
                sampleJob={sampleJobDescription}
                error={error}
              />
            </div>
          )}

          {appState === 'processing' && (
            <div className="py-12 animate-in fade-in duration-500">
              <ProcessingState />
            </div>
          )}

          {appState === 'results' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <ResultsTable
                candidates={candidates}
                onViewProfile={handleViewProfile}
              />
            </div>
          )}
        </div>
      </div>

      {/* Details Slide-over/Dialog */}
      <CandidateDetailsPanel
        candidate={selectedCandidate}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        requiredExperience={requiredExperience}
      />

      {/* Simple Footer */}
      <footer className="border-t border-border/40 py-8 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground font-medium">
            © 2024 TalentMatch AI. Precision matching for elite teams.
          </p>
        </div>
      </footer>
    </main>
  );
}
