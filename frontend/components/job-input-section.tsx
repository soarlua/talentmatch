'use client';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, AlertCircle } from 'lucide-react';
import type { JobDescription } from '@/lib/types';

interface JobInputSectionProps {
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  onRunMatching: () => void;
  isProcessing: boolean;
  sampleJob: JobDescription;
  error?: string | null;
}

export function JobInputSection({
  jobDescription,
  onJobDescriptionChange,
  onRunMatching,
  isProcessing,
  sampleJob,
  error
}: JobInputSectionProps) {
  const formatHelperText = () => {
    const mandatorySkills = sampleJob.requirements
      .filter(r => r.priority === 'mandatory')
      .map(r => r.skill);
    const optionalSkills = sampleJob.requirements
      .filter(r => r.priority === 'optional')
      .map(r => r.skill);
    const mandatoryExtras = sampleJob.extras
      .filter(e => e.priority === 'mandatory')
      .map(e => e.value);
    const optionalExtras = sampleJob.extras
      .filter(e => e.priority === 'optional')
      .map(e => e.value);

    return (
      <div className="space-y-3 text-sm">
        <div>
          <span className="text-primary font-medium">Job Title:</span>
          <span className="text-muted-foreground ml-2">{sampleJob.job_title}</span>
        </div>
        <div>
          <span className="text-primary font-medium">Required Skills:</span>
          <span className="text-muted-foreground ml-2">{mandatorySkills.join(', ')}</span>
        </div>
        {optionalSkills.length > 0 && (
          <div>
            <span className="text-muted-foreground font-medium">Nice to have:</span>
            <span className="text-muted-foreground ml-2">{optionalSkills.join(', ')}</span>
          </div>
        )}
        <div>
          <span className="text-primary font-medium">Experience:</span>
          <span className="text-muted-foreground ml-2">{sampleJob.experience.years}+ years (required)</span>
        </div>
        <div>
          <span className="text-primary font-medium">Requirements:</span>
          <span className="text-muted-foreground ml-2">{mandatoryExtras.join(', ')}</span>
        </div>
        {optionalExtras.length > 0 && (
          <div>
            <span className="text-muted-foreground font-medium">Preferred:</span>
            <span className="text-muted-foreground ml-2">{optionalExtras.join(', ')}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Job Description</CardTitle>
        <CardDescription>
          Paste or type the job requirements below. Our AI will analyze and match candidates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-secondary/50 p-4 border border-border/50">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Expected Format
          </p>
          {formatHelperText()}
        </div>
        
        <Textarea
          placeholder={`Paste your job description JSON here. Example:\n${JSON.stringify(sampleJob, null, 2)}`}
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          className="min-h-[200px] bg-secondary/30 border-border/50 resize-none font-mono text-sm"
        />
        
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <Button
          onClick={onRunMatching}
          disabled={isProcessing || !jobDescription.trim()}
          className="w-full"
          size="lg"
        >
          <Sparkles className="mr-2 size-4" />
          {isProcessing ? 'Analyzing...' : 'Run Matching'}
        </Button>
      </CardContent>
    </Card>
  );
}
