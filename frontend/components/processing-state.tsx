'use client';

import { BrainCircuit } from 'lucide-react';

export function ProcessingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-8 max-w-md mx-auto">
      <div className="relative">
        {/* Animated background glow */}
        <div className="absolute inset-0 blur-3xl bg-[#A100FF]/20 rounded-full animate-pulse scale-150" />
        
        {/* Icon container */}
        <div className="relative flex items-center justify-center size-20 rounded-2xl bg-white shadow-xl border border-purple-100 animate-bounce duration-[2000ms]">
          <BrainCircuit className="size-10 text-[#A100FF]" />
        </div>
        
        {/* Orbital dots */}
        <div className="absolute -top-2 -right-2 size-4 rounded-full bg-blue-500 animate-ping" />
      </div>
      
      <div className="text-center space-y-3">
        <h3 className="text-xl font-bold text-[#0F172A] tracking-tight">AI Analysis in Progress</h3>
        <p className="text-slate-500 font-medium leading-relaxed">
          Our matching engine is currently analyzing candidate profiles against your requirements...
        </p>
      </div>
      
      {/* Loading bar */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
        <div className="h-full bg-gradient-to-r from-[#A100FF] to-[#2563EB] w-full animate-progress-fast origin-left" />
      </div>
    </div>
  );
}
