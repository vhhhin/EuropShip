import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Session = {
  id: string;
  agentId: string;
  date: string;
  startTime: number;
  endTime: number;
  duration: number;
};

type TimeTrackingContextType = {
  isRunning: boolean;
  elapsedTime: number;
  startTimer: () => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  formatTime: (seconds: number) => string;
  sessions: Session[];
};

export const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "timeTrackingState";

function getInitialState() {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      const { isRunning, elapsedTime, sessionStart } = JSON.parse(stored);
      let newElapsed = elapsedTime;
      if (isRunning && sessionStart) {
        // Recalcule le temps écoulé si la session était en cours
        newElapsed += Math.floor((Date.now() - sessionStart) / 1000);
      }
      return {
        isRunning: !!isRunning,
        elapsedTime: newElapsed,
        sessionStart: isRunning && sessionStart ? sessionStart : null,
      };
    } catch {
      // fallback
    }
  }
  return { isRunning: false, elapsedTime: 0, sessionStart: null };
}

export function TimeTrackingProvider({ children }: { children: ReactNode }) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const sessionStartRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();

  // Initialisation
  useEffect(() => {
    const { isRunning, elapsedTime, sessionStart } = getInitialState();
    setIsRunning(isRunning);
    setElapsedTime(elapsedTime);
    sessionStartRef.current = sessionStart;
    if (isRunning && sessionStart) {
      startInterval();
    }
    // eslint-disable-next-line
  }, []);

  // Persistance
  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        isRunning,
        elapsedTime,
        sessionStart: sessionStartRef.current,
      })
    );
  }, [isRunning, elapsedTime]);

  function startInterval() {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      if (sessionStartRef.current) {
        setElapsedTime(
          Math.floor((Date.now() - sessionStartRef.current) / 1000)
        );
      }
    }, 1000);
  }

  function clearIntervalTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function startTimer() {
    if (isRunning) return;
    const now = Date.now();
    sessionStartRef.current = now - elapsedTime * 1000;
    setIsRunning(true);
    startInterval();
  }

  function pauseTimer() {
    if (!isRunning) return;
    if (sessionStartRef.current) {
      setElapsedTime(Math.floor((Date.now() - sessionStartRef.current) / 1000));
    }
    setIsRunning(false);
    clearIntervalTimer();
  }

  function stopTimer() {
    setIsRunning(false);
    setElapsedTime(0);
    sessionStartRef.current = null;
    clearIntervalTimer();
  }

  function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <TimeTrackingContext.Provider
      value={{ isRunning, elapsedTime, startTimer, pauseTimer, stopTimer, formatTime, sessions }}
    >
      {children}
    </TimeTrackingContext.Provider>
  );
}

export function useTimeTracking() {
  const context = useContext(TimeTrackingContext);
  if (!context) {
    throw new Error("useTimeTracking must be used within a TimeTrackingProvider");
  }
  return context;
}

export const useTimeTrackingContext = () => {
  const ctx = useContext(TimeTrackingContext);
  if (!ctx) {
    throw new Error('useTimeTrackingContext must be used inside TimeTrackingProvider');
  }
  return ctx;
};