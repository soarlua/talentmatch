'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, TrendingUp } from 'lucide-react';
import type { CandidateMatch } from '@/lib/types';

interface ResultsTableProps {
  candidates: CandidateMatch[];
  onViewProfile: (candidate: CandidateMatch) => void;
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 75) return 'text-primary';
  if (score >= 60) return 'text-amber-400';
  return 'text-muted-foreground';
}

function getScoreBackground(score: number): string {
  if (score >= 90) return 'bg-emerald-400/10';
  if (score >= 75) return 'bg-primary/10';
  if (score >= 60) return 'bg-amber-400/10';
  return 'bg-muted/50';
}

export function ResultsTable({ candidates, onViewProfile }: ResultsTableProps) {
  const sortedCandidates = [...candidates].sort((a, b) => b.matchScore - a.matchScore);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              Matching Results
            </CardTitle>
            <CardDescription>
              {candidates.length} candidates ranked by match score
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="w-12 text-muted-foreground">Rank</TableHead>
              <TableHead className="text-muted-foreground">Candidate Name</TableHead>
              <TableHead className="w-32 text-muted-foreground">Match Score</TableHead>
              <TableHead className="w-32 text-right text-muted-foreground">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCandidates.map((candidate, index) => (
              <TableRow 
                key={candidate.id}
                className="cursor-pointer hover:bg-secondary/50 border-border/50 transition-colors"
                onClick={() => onViewProfile(candidate)}
              >
                <TableCell className="font-medium text-muted-foreground">
                  #{index + 1}
                </TableCell>
                <TableCell className="font-medium">{candidate.name}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center justify-center w-14 py-1 rounded-md font-semibold text-sm ${getScoreColor(candidate.matchScore)} ${getScoreBackground(candidate.matchScore)}`}>
                    {candidate.matchScore}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewProfile(candidate);
                    }}
                    className="text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <Eye className="size-4 mr-1" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
