"use client";

import React, { useState } from "react";
import { useAppContext } from "./Providers";
import { api } from "../lib/api";
import { BrainCircuit, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const AIAnalysisPanel = () => {
  const { selectedSession, setSelectedSession } = useAppContext();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!selectedSession) return null;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await api.analyzeSession(selectedSession.id);
      setSelectedSession({
        ...selectedSession,
        geminiAnalysis: result.analysis,
      });
    } catch (err: any) {
      setError(err.message || "Failed to analyze session");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 glow-box-blue">
      <div 
        className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <BrainCircuit className="text-blue-400" size={20} />
          <h2 className="text-sm font-semibold tracking-wider text-slate-200 uppercase">
            AI Root Cause Analysis
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {!selectedSession.geminiAnalysis && !isAnalyzing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAnalyze();
                setIsExpanded(true);
              }}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded transition-all shadow-[0_0_10px_rgba(59,130,246,0.3)]"
            >
              Generate Report
            </button>
          )}
          {isExpanded ? <ChevronUp size={16} className="text-slate-500"/> : <ChevronDown size={16} className="text-slate-500"/>}
        </div>
      </div>

      {isExpanded && (
        <div className="transition-all">
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-8 gap-3"
              >
                <Loader2 className="animate-spin text-blue-500" size={32} />
                <p className="text-xs text-blue-400 font-mono animate-pulse">
                  Gemini 2.5 Pro is analyzing telemetry...
                </p>
              </motion.div>
            ) : selectedSession.geminiAnalysis ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="prose prose-invert prose-sm max-w-none text-slate-300 font-mono text-xs leading-relaxed"
              >
                <div dangerouslySetInnerHTML={{ __html: selectedSession.geminiAnalysis.replace(/\n/g, "<br/>") }} />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-slate-500 font-mono py-4 text-center"
              >
                Click "Generate Report" to reconstruct the causal chain.
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded font-mono">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
