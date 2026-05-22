"use client";

import React from "react";
import { Play, Pause, RotateCcw, Sparkles } from "lucide-react";

interface ReplayControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  progress: number; // 0 to 100
  onChangeProgress: (progress: number) => void;
  speed: number; // 1, 2, 5
  onChangeSpeed: (speed: number) => void;
  currentTimeOffsetMs: number;
  totalDurationMs: number;
}

export default function ReplayControls({
  isPlaying,
  onPlayPause,
  onReset,
  progress,
  onChangeProgress,
  speed,
  onChangeSpeed,
  currentTimeOffsetMs,
  totalDurationMs,
}: ReplayControlsProps) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 glow-box-blue backdrop-blur-md">
      <div className="flex flex-col gap-3">
        {/* Slider timeline */}
        <div className="flex items-center gap-4 w-full">
          <span className="text-[10px] font-mono text-slate-400 w-12 text-right">
            {currentTimeOffsetMs.toFixed(0)}ms
          </span>
          <div className="flex-1 relative group py-2">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => onChangeProgress(Number(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 focus:outline-none transition-all"
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400 w-12 text-left">
            {totalDurationMs.toFixed(0)}ms
          </span>
        </div>

        {/* Buttons and Settings */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onPlayPause}
              className={`p-2 rounded-lg border transition-all ${
                isPlaying
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
                  : "bg-blue-500/10 border-blue-500/40 text-blue-400 hover:bg-blue-500/20"
              }`}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            
            <button
              onClick={onReset}
              className="p-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
              title="Reset Timeline"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Speed selection */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              {[1, 2, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => onChangeSpeed(s)}
                  className={`text-[10px] font-mono px-2 py-1 rounded transition-all ${
                    speed === s
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
            
            <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 border border-slate-800/80 bg-slate-950/40 px-2 py-1.5 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>TIME MACHINE ENGAGED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
