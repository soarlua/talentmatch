'use client';

import { Spinner } from '@/components/ui/spinner';

export function ProcessingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="relative">
        <div className="absolute inset-0 blur-xl bg-primary/30 rounded-full animate-pulse" />
        <Spinner className="size-12 text-primary relative" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-foreground">Analyzing candidates and matching profiles...</p>
        <p className="text-sm text-muted-foreground">This may take a few moments</p>
      </div>
    </div>
  );
}
