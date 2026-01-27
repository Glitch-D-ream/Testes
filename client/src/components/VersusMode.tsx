
import React, { useState } from 'react';
import { Scale, Users, Zap, TrendingUp, AlertTriangle } from 'lucide-react';

interface ComparisonData {
  p1: any;
  p2: any;
}

export const VersusMode: React.FC<ComparisonData> = ({ p1, p2 }) => {
  if (!p1 || !p2) return null;

  const MetricRow = ({ label, v1, v2, suffix = "%" }: { label: string, v1: number, v2: number, suffix?: string }) => (
    <div className="py-4 border-b border-border">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1 text-right">
          <span className={`text-xl font-black ${v1 > v2 ? 'text-emerald-500' : 'text-white'}`}>{v1}{suffix}</span>
        </div>
        <div className="w-full max-w-[100px] h-2 bg-secondary rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-500" style={{ width: `${(v1 / (v1 + v2)) * 100}%` }} />
            <div className="h-full bg-blue-500" style={{ width: `${(v2 / (v1 + v2)) * 100}%` }} />
        </div>
        <div className="flex-1 text-left">
          <span className={`text-xl font-black ${v2 > v1 ? 'text-blue-500' : 'text-white'}`}>{v2}{suffix}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-black p-8 border-b border-border">
        <div className="flex items-center justify-between gap-8">
          <div className="flex-1 text-center">
            <h3 className="text-2xl font-black tracking-tighter uppercase text-emerald-500">{p1.politicianName}</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Target Alpha</p>
          </div>
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center rotate-12">
            <Scale className="text-black" size={24} />
          </div>
          <div className="flex-1 text-center">
            <h3 className="text-2xl font-black tracking-tighter uppercase text-blue-500">{p2.politicianName}</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Target Beta</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-2">
        <MetricRow label="Credibility Index" v1={p1.viabilityScore} v2={p2.viabilityScore} />
        <MetricRow label="Audit Confidence" v1={p1.confidenceLevel} v2={p2.confidenceLevel} />
        <MetricRow label="Sources Verified" v1={p1.sourcesAnalyzed} v2={p2.sourcesAnalyzed} suffix="" />
        <MetricRow label="Discourse Consistency" v1={p1.benchmarkResult?.metrics?.consistencyScore || 0} v2={p2.benchmarkResult?.metrics?.consistencyScore || 0} />
      </div>

      <div className="p-4 bg-secondary/50 flex items-center justify-center gap-2">
        <Zap size={14} className="text-emerald-500" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Comparative Forensic Protocol Active</span>
      </div>
    </div>
  );
};
