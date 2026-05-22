"use client";

import React, { useState, useEffect } from "react";
import { useAppContext } from "./Providers";
import { api } from "../lib/api";
import { Wand2, Loader2, BarChart2, ChevronDown, ChevronUp } from "lucide-react";
import { SimulationResult } from "../types";

export const SimulationPanel = () => {
  const { selectedSession } = useAppContext();
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<SimulationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (selectedSession) {
      loadResults();
    } else {
      setResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSession]);

  const loadResults = async () => {
    if (!selectedSession) return;
    try {
      const data = await api.getSimulationResults(selectedSession.id);
      setResults(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSimulate = async () => {
    if (!selectedSession) return;
    setIsSimulating(true);
    setError(null);
    try {
      const result = await api.simulateSession(selectedSession.id);
      setResults(prev => [result, ...prev]);
    } catch (err: any) {
      setError(err.message || "Failed to run simulation");
    } finally {
      setIsSimulating(false);
    }
  };

  if (!selectedSession) return null;

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 glow-box-amber">
      <div 
        className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Wand2 className="text-amber-500" size={20} />
          <h2 className="text-sm font-semibold tracking-wider text-slate-200 uppercase">
            Counterfactual Simulation
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSimulate();
              setIsExpanded(true);
            }}
            disabled={isSimulating}
            className="text-xs bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded transition-all shadow-[0_0_10px_rgba(245,158,11,0.3)] flex items-center gap-2"
          >
            {isSimulating ? <Loader2 size={14} className="animate-spin" /> : <BarChart2 size={14} />}
            Simulate Fix
          </button>
          {isExpanded ? <ChevronUp size={16} className="text-slate-500"/> : <ChevronDown size={16} className="text-slate-500"/>}
        </div>
      </div>

      {isExpanded && (
        <div className="transition-all">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded font-mono">
              {error}
            </div>
          )}

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {results.length === 0 && !isSimulating && (
              <div className="text-xs text-slate-500 font-mono py-4 text-center">
                Run a simulation to see what would happen if retries were capped.
              </div>
            )}
            
            {results.map((res) => (
              <div key={res.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-emerald-400 tracking-wider">FIX APPLIED: Capped Retries</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(res.runAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col items-center justify-center">
                    <span className="text-slate-500 text-[10px]">Orig Failures</span>
                    <span className="text-red-400 text-lg font-bold">{res.originalFailureCount}</span>
                  </div>
                  <div className="bg-emerald-950/30 p-2 rounded border border-emerald-900/50 flex flex-col items-center justify-center">
                    <span className="text-emerald-500/70 text-[10px]">Simulated Failures</span>
                    <span className="text-emerald-400 text-lg font-bold">{res.simulatedFailureCount}</span>
                  </div>
                </div>
                {res.simulationSummary && (
                  <div className="mt-2 text-[10px] text-slate-400 font-mono italic">
                    "{res.simulationSummary}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
