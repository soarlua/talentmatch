'use client';

import { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Briefcase, ExternalLink, User } from 'lucide-react';
import type { CandidateMatch } from '@/lib/types';

interface CandidateDetailsPanelProps {
  candidate: CandidateMatch | null;
  isOpen: boolean;
  onClose: () => void;
  requiredExperience: number;
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-600';
  if (score >= 75) return 'text-[#A100FF]';
  if (score >= 60) return 'text-amber-600';
  return 'text-slate-500';
}

export const CandidateDetailsPanel = memo(({
  candidate,
  isOpen,
  onClose,
  requiredExperience
}: CandidateDetailsPanelProps) => {
  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl bg-white border-none shadow-2xl p-0 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#A100FF] to-[#2563EB]" />
        
        <div className="p-8 space-y-8">
          <DialogHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-purple-50 flex items-center justify-center text-[#A100FF]">
                  <User className="size-8" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                    {candidate.name}
                  </DialogTitle>
                  <DialogDescription className="text-sm font-semibold text-[#A100FF] uppercase tracking-wider">
                    Candidate Profile Analysis
                  </DialogDescription>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-black ${getScoreColor(candidate.matchScore)}`}>
                  {candidate.matchScore}%
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Match Score</div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-8">
            {/* Executive Summary */}
            <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="absolute -top-3 left-4 px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Executive Summary
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                {candidate.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Matched Skills */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  Matched Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {candidate.matchedSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Requirements */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <XCircle className="size-4 text-rose-500" />
                  Missing Requirements
                </h4>
                <div className="flex flex-wrap gap-2">
                  {candidate.missingRequirements.length > 0 ? (
                    candidate.missingRequirements.map((req, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100"
                      >
                        {req}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-medium text-slate-400 italic">None - Perfect match</span>
                  )}
                </div>
              </div>
            </div>

            {/* Experience Comparison */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Briefcase className="size-4 text-[#A100FF]" />
                Experience Analysis
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Required</p>
                  <p className="text-xl font-extrabold text-[#0F172A]">{requiredExperience} Years</p>
                </div>
                <div className="rounded-2xl bg-purple-50/50 p-4 border border-purple-100/50">
                  <p className="text-[10px] text-[#A100FF] font-bold uppercase tracking-widest mb-1">Candidate</p>
                  <p className={`text-xl font-extrabold ${candidate.experienceYears >= requiredExperience ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {candidate.experienceYears} Years
                  </p>
                </div>
              </div>
            </div>

            {/* LinkedIn Button */}
            <Button
              className="w-full bg-[#0A66C2] hover:bg-[#084d94] text-white shadow-lg shadow-blue-500/10 h-12 text-sm font-bold rounded-xl"
              asChild
            >
              <a 
                href={candidate.linkedinUrl} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-4 mr-2" />
                View Full LinkedIn Profile
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

CandidateDetailsPanel.displayName = 'CandidateDetailsPanel';
