import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

type Session = {
  id: string;
  agentId: string;
  agentName: string;
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
  getAllSessions: () => Session[];
};

export const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(undefined);

const SESSION_KEY_PREFIX = "agent_sessions_";
const TIMER_STATE_KEY = "euroship_time_tracking_state";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function loadTimerState(agentId: string) {
  try {
    const data = localStorage.getItem(`${TIMER_STATE_KEY}_${agentId}`);
    return data
      ? JSON.parse(data)
      : { isRunning: false, elapsedTime: 0, sessionStart: null };
  } catch {
    return { isRunning: false, elapsedTime: 0, sessionStart: null };
  }
}

function saveTimerState(agentId: string, state: any) {
  localStorage.setItem(`${TIMER_STATE_KEY}_${agentId}`, JSON.stringify(state));
}

function loadSessions(agentId: string): Session[] {
  try {
    const data = localStorage.getItem(`${SESSION_KEY_PREFIX}${agentId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveSessions(agentId: string, sessions: Session[]) {
  localStorage.setItem(`${SESSION_KEY_PREFIX}${agentId}`, JSON.stringify(sessions));
}

export function TimeTrackingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isAgent = user?.role === 'AGENT' && user?.email === 'agent.euroship';
  const agentId = user?.id;
  const agentName = user?.displayName || user?.email || "";

  // Timer state (per agent)
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const sessionStartRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load timer state and sessions for agent
  useEffect(() => {
    if (!isAgent || !agentId) return;
    const timerState = loadTimerState(agentId);
    setIsRunning(timerState.isRunning);
    setElapsedTime(timerState.elapsedTime);
    sessionStartRef.current = timerState.sessionStart;
    setSessions(loadSessions(agentId));
    if (timerState.isRunning && timerState.sessionStart) {
      startInterval();
    }
    // eslint-disable-next-line
  }, [isAgent, agentId]);

  // Save timer state for agent
  useEffect(() => {
    if (!isAgent || !agentId) return;
    saveTimerState(agentId, {
      isRunning,
      elapsedTime,
      sessionStart: sessionStartRef.current,
    });
  }, [isRunning, elapsedTime, isAgent, agentId]);

  // Save sessions for agent
  useEffect(() => {
    if (!isAgent || !agentId) return;
    saveSessions(agentId, sessions);
  }, [sessions, isAgent, agentId]);

  function startInterval() {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      if (sessionStartRef.current) {
        setElapsedTime(Math.floor((Date.now() - sessionStartRef.current) / 1000));
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
    if (!isAgent || isRunning) return;
    const now = Date.now();
    sessionStartRef.current = now - elapsedTime * 1000;
    setIsRunning(true);
    startInterval();
  }

  function pauseTimer() {
    if (!isAgent || !isRunning) return;
    if (sessionStartRef.current) {
      setElapsedTime(Math.floor((Date.now() - sessionStartRef.current) / 1000));
    }
    setIsRunning(false);
    clearIntervalTimer();
  }

  function stopTimer() {
    if (!isAgent || !agentId || !agentName) return;
    if (isRunning && sessionStartRef.current) {
      const now = Date.now();
      const duration = Math.floor((now - sessionStartRef.current) / 1000);
      const session: Session = {
        id: `session-${now}`,
        agentId,
        agentName,
        date: getToday(),
        startTime: sessionStartRef.current,
        endTime: now,
        duration,
      };
      setSessions((prev) => [...prev, session]);
      setElapsedTime(0);
      setIsRunning(false);
      sessionStartRef.current = null;
      clearIntervalTimer();
    }
  }

  function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  // For admin: load all agent sessions
  function getAllSessions(): Session[] {
    if (user?.role !== 'ADMIN') return sessions;
    const allSessions: Session[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SESSION_KEY_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            allSessions.push(...JSON.parse(data));
          } catch {}
        }
      }
    }
    return allSessions;
  }

  const value: TimeTrackingContextType = {
    isRunning,
    elapsedTime,
    startTimer,
    pauseTimer,
    stopTimer,
    formatTime,
    sessions,
    getAllSessions,
  };

  return (
    <TimeTrackingContext.Provider value={value}>
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