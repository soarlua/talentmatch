'use client';

import { useState } from 'react';
import { JobInputSection } from '@/components/job-input-section';
import { ProcessingState } from '@/components/processing-state';
import { ResultsTable } from '@/components/results-table';
import { CandidateDetailsPanel } from '@/components/candidate-details-panel';
import { sampleJobDescription, type CandidateMatch, type JobDescription } from '@/lib/types';
import { talentMatchApi, parseJobDescription, ApiError } from '@/lib/api';
import { Sparkles } from 'lucide-react';

type AppState = 'input' | 'processing' | 'results';

export default function TalentMatchPage() {
  const [appState, setAppState] = useState<AppState>('input');
  const [jobDescription, setJobDescription] = useState('');
  const [parsedJob, setParsedJob] = useState<JobDescription | null>(null);
  const [candidates, setCandidates] = useState<CandidateMatch[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateMatch | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunMatching = async () => {
    setError(null);
    
    // Parse the job description JSON
    let parsed: JobDescription;
    try {
      parsed = parseJobDescription(jobDescription);
      setParsedJob(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse job description');
      return;
    }

    setAppState('processing');
    
    try {
      const response = await talentMatchApi.match(parsed);
      // Sort candidates by matchScore descending
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
  };

  const handleViewProfile = (candidate: CandidateMatch) => {
    setSelectedCandidate(candidate);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedCandidate(null);
  };

  const handleReset = () => {
    setAppState('input');
    setJobDescription('');
    setParsedJob(null);
    setCandidates([]);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10 border border-primary/20">
                <Sparkles className="size-5 text-primary" />
              </div>
              <span className="text-xl font-semibold text-foreground tracking-tight">
                TalentMatch AI
              </span>
            </div>
            {appState === 'results' && (
              <button
                onClick={handleReset}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                New Search
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-border/50 bg-secondary/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight text-balance">
              AI-Powered Candidate Matching
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              Automatically match candidates to job openings using AI-based analysis of skills, experience, and requirements.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {appState === 'input' && (
          <div className="max-w-2xl mx-auto">
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
          <ProcessingState />
        )}

        {appState === 'results' && (
          <ResultsTable
            candidates={candidates}
            onViewProfile={handleViewProfile}
          />
        )}
      </section>

      {/* Candidate Details Panel */}
      <CandidateDetailsPanel
        candidate={selectedCandidate}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
        requiredExperience={parsedJob?.experience.years ?? sampleJobDescription.experience.years}
      />
    </main>
  );
}
