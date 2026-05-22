"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ReplaySession, TelemetrySpan } from "../types";
import { getSignalRConnection, ensureConnection, joinSessionGroup, leaveSessionGroup } from "../lib/signalr";
import { api } from "../lib/api";

interface AppContextState {
  selectedSession: ReplaySession | null;
  setSelectedSession: React.Dispatch<React.SetStateAction<ReplaySession | null>>;
  spans: TelemetrySpan[];
  setSpans: React.Dispatch<React.SetStateAction<TelemetrySpan[]>>;
  currentTime: number; // UnixNano timestamp used for the slider
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  minTime: number;
  maxTime: number;
}

const AppContext = createContext<AppContextState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedSession, setSelectedSession] = useState<ReplaySession | null>(null);
  const [spans, setSpans] = useState<TelemetrySpan[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const minTime = spans.length > 0 ? Math.min(...spans.map(s => s.startTimeUnixNano)) : 0;
  const maxTime = spans.length > 0 ? Math.max(...spans.map(s => s.endTimeUnixNano)) : 0;

  // SignalR integration
  useEffect(() => {
    const conn = getSignalRConnection();
    
    const handleNewSpan = (spanJson: string) => {
      try {
        const span = JSON.parse(spanJson) as TelemetrySpan;
        setSpans(prev => {
          // avoid duplicates
          if (prev.find(p => p.id === span.id)) return prev;
          return [...prev, span];
        });
      } catch (err) {
        console.error("Failed to parse incoming span", err);
      }
    };

    conn.on("ReceiveTelemetry", handleNewSpan);

    ensureConnection().catch(console.error);

    return () => {
      conn.off("ReceiveTelemetry", handleNewSpan);
    };
  }, []);

  // Join/Leave groups when session changes
  useEffect(() => {
    if (selectedSession) {
      joinSessionGroup(selectedSession.id).catch(console.error);
    }

    return () => {
      if (selectedSession) {
        leaveSessionGroup(selectedSession.id).catch(console.error);
      }
    };
  }, [selectedSession]);

  // Fetch historical spans when session changes (e.g. on page refresh)
  useEffect(() => {
    if (selectedSession) {
      api.getSessionSpans(selectedSession.id)
        .then(fetchedSpans => {
          setSpans(fetchedSpans);
        })
        .catch(console.error);
    } else {
      setSpans([]);
    }
  }, [selectedSession]);

  // Adjust current time slider boundary when new spans arrive
  useEffect(() => {
    if (maxTime > 0 && currentTime === 0) {
      setCurrentTime(maxTime); // Snap to max time initially
    }
  }, [maxTime, currentTime]);

  return (
    <AppContext.Provider
      value={{
        selectedSession,
        setSelectedSession,
        spans,
        setSpans,
        currentTime,
        setCurrentTime,
        minTime,
        maxTime,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
