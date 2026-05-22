"use client";

import React, { useState } from "react";
import { api } from "../lib/api";
import { useAppContext } from "./Providers";
import { Zap, Loader2 } from "lucide-react";

export const ScenarioTrigger = () => {
  const { setSelectedSession } = useAppContext();
  const [isTriggering, setIsTriggering] = useState(false);

  const handleTrigger = async (scenario: string) => {
    setIsTriggering(true);
    try {
      const session = await api.triggerScenario(scenario);
      setSelectedSession(session);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-5 glow-box-green">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
        <Zap className="text-emerald-500" size={20} />
        <h2 className="text-sm font-semibold tracking-wider text-slate-200 uppercase">
          Inject Chaos
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => handleTrigger("retry-storm")}
          disabled={isTriggering}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono py-2.5 px-4 rounded transition-colors border border-slate-700 disabled:opacity-50"
        >
          {isTriggering ? <Loader2 size={14} className="animate-spin" /> : null}
          Trigger: Retry Storm
        </button>

        <button
          onClick={() => handleTrigger("cache-latency")}
          disabled={isTriggering}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono py-2.5 px-4 rounded transition-colors border border-slate-700 disabled:opacity-50"
        >
          {isTriggering ? <Loader2 size={14} className="animate-spin" /> : null}
          Trigger: Cache Latency Spike
        </button>
      </div>
    </div>
  );
};
