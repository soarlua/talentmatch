'use client';

import { useMemo, memo, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, AlertCircle, FileText, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JobDescription } from '@/lib/types';

interface JobInputSectionProps {
  jobDescription: string;
  onJobDescriptionChange: (value: string) => void;
  onRunMatching: (mode: 'json' | 'text') => void;
  isProcessing: boolean;
  sampleJob: JobDescription;
  error?: string | null;
}

const FormatHelper = memo(({ sampleJob }: { sampleJob: JobDescription }) => {
  const { mandatorySkills, optionalSkills, mandatoryExtras, optionalExtras } = useMemo(() => {
    const skills = {
      mandatorySkills: [] as string[],
      optionalSkills: [] as string[],
    };
    
    for (const r of sampleJob.requirements) {
      if (r.priority === 'mandatory') skills.mandatorySkills.push(r.skill);
      else skills.optionalSkills.push(r.skill);
    }

    const extras = {
      mandatoryExtras: [] as string[],
      optionalExtras: [] as string[],
    };

    for (const e of sampleJob.extras) {
      if (e.priority === 'mandatory') extras.mandatoryExtras.push(e.value);
      else extras.optionalExtras.push(e.value);
    }

    return { ...skills, ...extras };
  }, [sampleJob]);

  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <span className="text-primary font-semibold block text-[11px] uppercase tracking-wider mb-1">Required Skills</span>
          <span className="text-muted-foreground">{mandatorySkills.join(', ')}</span>
        </div>
        <div>
          <span className="text-primary font-semibold block text-[11px] uppercase tracking-wider mb-1">Experience</span>
          <span className="text-muted-foreground">{sampleJob.experience.years}+ years</span>
        </div>
      </div>
      <div>
        <span className="text-primary font-semibold block text-[11px] uppercase tracking-wider mb-1">Requirements</span>
        <span className="text-muted-foreground">{mandatoryExtras.join(', ')}</span>
      </div>
    </div>
  );
});

FormatHelper.displayName = 'FormatHelper';

export const JobInputSection = memo(({
  jobDescription,
  onJobDescriptionChange,
  onRunMatching,
  isProcessing,
  sampleJob,
  error
}: JobInputSectionProps) => {
  const [inputMode, setInputMode] = useState<'text' | 'json'>('text');

  const placeholder = useMemo(() => 
    inputMode === 'json' 
      ? `Paste your job description JSON here. Example:\n${JSON.stringify(sampleJob, null, 2)}`
      : "Paste the job description or candidate requirements in plain text. Our AI will extract the key details for matching.",
    [sampleJob, inputMode]
  );

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-[#A100FF] to-[#2563EB]" />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight">Requirement Analysis</CardTitle>
            <CardDescription className="text-sm">
              Define what you're looking for to find the perfect candidate.
            </CardDescription>
          </div>
          <div className="flex bg-secondary/50 p-1 rounded-lg border border-border/50">
            <button
              onClick={() => setInputMode('text')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                inputMode === 'text' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText className="size-3.5" />
              Plain Text
            </button>
            <button
              onClick={() => setInputMode('json')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                inputMode === 'json' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Code2 className="size-3.5" />
              JSON
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-xl bg-secondary/30 p-5 border border-border/50">
          <p className="text-[10px] font-bold text-[#A100FF] uppercase tracking-[0.2em] mb-4">
            Analysis Reference
          </p>
          <FormatHelper sampleJob={sampleJob} />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground ml-1">
            {inputMode === 'text' ? 'Job Description / Requirements' : 'Structured JSON Data'}
          </label>
          <Textarea
            placeholder={placeholder}
            value={jobDescription}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
            className="min-h-[240px] bg-secondary/20 border-border/50 focus:border-[#A100FF]/50 focus:ring-[#A100FF]/20 resize-none font-sans text-sm leading-relaxed p-4 transition-all"
          />
        </div>
        
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold">Input Error</p>
              <p className="opacity-90">{error}</p>
            </div>
          </div>
        )}
        
        <Button
          onClick={() => onRunMatching(inputMode)}
          disabled={isProcessing || !jobDescription.trim()}
          className="w-full bg-[#A100FF] hover:bg-[#8B00DD] text-white shadow-lg shadow-purple-500/20 h-12 text-base font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
          size="lg"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            <>
              <Sparkles className="mr-2 size-5" />
              Find Matches
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
});

JobInputSection.displayName = 'JobInputSection';
