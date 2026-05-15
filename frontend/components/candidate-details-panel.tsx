'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Briefcase, ExternalLink } from 'lucide-react';
import type { CandidateMatch } from '@/lib/types';

interface CandidateDetailsPanelProps {
  candidate: CandidateMatch | null;
  isOpen: boolean;
  onClose: () => void;
  requiredExperience: number;
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 75) return 'text-primary';
  if (score >= 60) return 'text-amber-400';
  return 'text-muted-foreground';
}

export function CandidateDetailsPanel({
  candidate,
  isOpen,
  onClose,
  requiredExperience
}: CandidateDetailsPanelProps) {
  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border/50">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{candidate.name}</DialogTitle>
            <span className={`text-2xl font-bold ${getScoreColor(candidate.matchScore)}`}>
              {candidate.matchScore}%
            </span>
          </div>
          <DialogDescription className="text-muted-foreground">
            Candidate Profile Analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Executive Summary */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Executive Summary
            </h4>
            <p className="text-foreground leading-relaxed">
              {candidate.summary}
            </p>
          </div>

          {/* Matched Skills */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <CheckCircle className="size-4 text-emerald-400" />
              Matched Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {candidate.matchedSkills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                >
                  <CheckCircle className="size-3 mr-1.5" />
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Missing Requirements */}
          {candidate.missingRequirements.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <XCircle className="size-4 text-destructive" />
                Missing Requirements
              </h4>
              <div className="flex flex-wrap gap-2">
                {candidate.missingRequirements.map((req, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-destructive/10 text-destructive border border-destructive/20"
                  >
                    <XCircle className="size-3 mr-1.5" />
                    {req}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience Comparison */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Briefcase className="size-4 text-primary" />
              Experience Comparison
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-secondary/50 p-4 border border-border/50">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Required</p>
                <p className="text-2xl font-bold text-foreground">{requiredExperience} years</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-4 border border-border/50">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Candidate</p>
                <p className={`text-2xl font-bold ${candidate.experienceYears >= requiredExperience ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {candidate.experienceYears} years
                </p>
              </div>
            </div>
          </div>

          {/* LinkedIn Button */}
          <Button
            className="w-full"
            variant="outline"
            asChild
          >
            <a 
              href={candidate.linkedinUrl} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-4 mr-2" />
              View LinkedIn Profile
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
