'use client';

import { useMemo, memo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, TrendingUp, User } from 'lucide-react';
import type { CandidateMatch } from '@/lib/types';

interface ResultsTableProps {
  candidates: CandidateMatch[];
  onViewProfile: (candidate: CandidateMatch) => void;
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-600';
  if (score >= 75) return 'text-[#A100FF]';
  if (score >= 60) return 'text-amber-600';
  return 'text-slate-500';
}

function getScoreBackground(score: number): string {
  if (score >= 90) return 'bg-emerald-50';
  if (score >= 75) return 'bg-purple-50';
  if (score >= 60) return 'bg-amber-50';
  return 'bg-slate-50';
}

export const ResultsTable = memo(({ candidates, onViewProfile }: ResultsTableProps) => {
  const sortedCandidates = useMemo(() => 
    [...candidates].sort((a, b) => b.matchScore - a.matchScore),
    [candidates]
  );

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden bg-white">
      <div className="h-1 bg-gradient-to-r from-[#A100FF] to-[#2563EB]" />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="size-5 text-[#A100FF]" />
              Matching Results
            </CardTitle>
            <CardDescription className="text-sm font-medium">
              {candidates.length} candidates ranked by AI analysis
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        <div className="border border-border/50 rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="w-16 text-[11px] font-bold uppercase tracking-wider text-slate-500 pl-6">Rank</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Candidate Information</TableHead>
                <TableHead className="w-32 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Match Score</TableHead>
                <TableHead className="w-32 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCandidates.map((candidate, index) => (
                <TableRow 
                  key={candidate.id}
                  className="group cursor-pointer hover:bg-slate-50/80 border-border/50 transition-colors"
                  onClick={() => onViewProfile(candidate)}
                >
                  <TableCell className="pl-6 py-4">
                    <span className="text-sm font-bold text-slate-400 group-hover:text-[#A100FF] transition-colors">
                      #{index + 1}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-purple-50 group-hover:text-[#A100FF] transition-all">
                        <User className="size-5" />
                      </div>
                      <span className="font-semibold text-[#0F172A]">{candidate.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <span className={`inline-flex items-center justify-center w-14 py-1 rounded-full font-bold text-xs border ${getScoreColor(candidate.matchScore)} ${getScoreBackground(candidate.matchScore)} border-current/10`}>
                      {candidate.matchScore}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-6 py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewProfile(candidate);
                      }}
                      className="text-[#A100FF] hover:text-[#A100FF] hover:bg-purple-50 font-bold text-xs uppercase tracking-wide"
                    >
                      <Eye className="size-4 mr-1.5" />
                      View Analysis
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
});

ResultsTable.displayName = 'ResultsTable';
