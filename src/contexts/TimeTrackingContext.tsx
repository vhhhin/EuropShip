import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Session, TimeTrackingContextType } from "@/types/timeTracking";

const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(undefined);

// LocalStorage keys
const SESSION_KEY_PREFIX = "euroship_sessions_";
const TIMER_STATE_KEY_PREFIX = "euroship_timer_state_";

// Helper functions
function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadTimerState(agentId: string): { isRunning: boolean; elapsedTime: number; sessionStart: number | null } {
  try {
    const data = localStorage.getItem(`${TIMER_STATE_KEY_PREFIX}${agentId}`);
    if (data) {
      const parsed = JSON.parse(data);
      // Validate that session is still valid (not from a previous day)
      if (parsed.sessionStart) {
        const sessionDate = new Date(parsed.sessionStart).toISOString().slice(0, 10);
        const today = getToday();
        if (sessionDate !== today) {
          // Session is from a previous day, reset it
          return { isRunning: false, elapsedTime: 0, sessionStart: null };
        }
      }
      return parsed;
    }
  } catch (error) {
    console.error("Error loading timer state:", error);
  }
  return { isRunning: false, elapsedTime: 0, sessionStart: null };
}

function saveTimerState(agentId: string, state: { isRunning: boolean; elapsedTime: number; sessionStart: number | null }): void {
  try {
    localStorage.setItem(`${TIMER_STATE_KEY_PREFIX}${agentId}`, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving timer state:", error);
  }
}

function loadSessions(agentId: string): Session[] {
  try {
    const data = localStorage.getItem(`${SESSION_KEY_PREFIX}${agentId}`);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading sessions:", error);
  }
  return [];
}

function saveSessions(agentId: string, sessions: Session[]): void {
  try {
    localStorage.setItem(`${SESSION_KEY_PREFIX}${agentId}`, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving sessions:", error);
  }
}

function getAllSessionsFromStorage(): Session[] {
  const allSessions: Session[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SESSION_KEY_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            allSessions.push(...JSON.parse(data));
          } catch (e) {
            console.error("Error parsing sessions from key:", key, e);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error loading all sessions:", error);
  }
  return allSessions;
}

export function TimeTrackingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isAgent = user?.role === 'AGENT';
  const agentId = user?.id || '';
  const agentName = user?.displayName || user?.username || '';

  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  
  // Refs for timer management
  const sessionStartRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize: Load timer state and sessions for agent
  useEffect(() => {
    if (!isAgent || !agentId || isInitializedRef.current) return;
    
    const timerState = loadTimerState(agentId);
    setIsRunning(timerState.isRunning);
    setElapsedTime(timerState.elapsedTime);
    sessionStartRef.current = timerState.sessionStart;
    setSessions(loadSessions(agentId));
    
    // Resume timer if it was running
    if (timerState.isRunning && timerState.sessionStart) {
      startInterval();
    }
    
    isInitializedRef.current = true;
  }, [isAgent, agentId]);

  // Timer interval management
  const startInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      if (sessionStartRef.current) {
        const now = Date.now();
        const elapsed = Math.floor((now - sessionStartRef.current) / 1000);
        setElapsedTime(elapsed);
      }
    }, 1000);
  }, []);

  const clearIntervalTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start timer
  const startTimer = useCallback(() => {
    if (!isAgent || isRunning || !agentId || !agentName) return;
    
    const now = Date.now();
    // If there's existing elapsed time, resume from that point
    if (elapsedTime > 0) {
      sessionStartRef.current = now - elapsedTime * 1000;
    } else {
      sessionStartRef.current = now;
    }
    
    setIsRunning(true);
    startInterval();
  }, [isAgent, isRunning, agentId, agentName, elapsedTime, startInterval]);

  // Stop timer (saves session)
  const stopTimer = useCallback(() => {
    if (!isAgent || !agentId || !agentName) return;
    
    const now = Date.now();
    const wasRunning = isRunning;
    
    // Clear interval first
    clearIntervalTimer();
    setIsRunning(false);
    
    // Save session if timer was running
    if (wasRunning && sessionStartRef.current) {
      const duration = Math.floor((now - sessionStartRef.current) / 1000);
      
      // Only save if duration is meaningful (at least 1 second)
      if (duration > 0) {
        const session: Session = {
          id: `session-${now}-${Math.random().toString(36).substr(2, 9)}`,
          agentId,
          agentName,
          date: getToday(),
          startTime: sessionStartRef.current,
          endTime: now,
          duration,
        };
        
        setSessions((prev) => {
          const updated = [...prev, session];
          saveSessions(agentId, updated);
          return updated;
        });
      }
    }
    
    // Reset timer state
    setElapsedTime(0);
    sessionStartRef.current = null;
  }, [isAgent, agentId, agentName, isRunning, clearIntervalTimer]);

  // Save timer state whenever it changes
  useEffect(() => {
    if (!isAgent || !agentId || !isInitializedRef.current) return;
    
    saveTimerState(agentId, {
      isRunning,
      elapsedTime,
      sessionStart: sessionStartRef.current,
    });
  }, [isRunning, elapsedTime, isAgent, agentId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearIntervalTimer();
    };
  }, [clearIntervalTimer]);

  // Format time helper
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Get all sessions (for admin or current agent)
  const getAllSessions = useCallback((): Session[] => {
    if (user?.role === 'ADMIN') {
      return getAllSessionsFromStorage();
    }
    return sessions;
  }, [user?.role, sessions]);

  // Get sessions by agent
  const getSessionsByAgent = useCallback((agentId: string): Session[] => {
    const allSessions = user?.role === 'ADMIN' 
      ? getAllSessionsFromStorage() 
      : sessions;
    return allSessions.filter(s => s.agentId === agentId);
  }, [user?.role, sessions]);

  // Get time by agent (for admin analytics)
  const getTimeByAgent = useCallback((): Record<string, { agentName: string; totalSeconds: number }> => {
    const allSessions = user?.role === 'ADMIN' 
      ? getAllSessionsFromStorage() 
      : sessions;
    
    const agentTimes: Record<string, { agentName: string; totalSeconds: number }> = {};
    allSessions.forEach(session => {
      if (!agentTimes[session.agentId]) {
        agentTimes[session.agentId] = {
          agentName: session.agentName,
          totalSeconds: 0,
        };
      }
      agentTimes[session.agentId].totalSeconds += session.duration;
    });
    
    return agentTimes;
  }, [user?.role, sessions]);

  // Get today's total time for current agent
  const getTodayTime = useCallback((): number => {
    if (!isAgent || !agentId) return 0;
    
    const today = getToday();
    const todaySessions = sessions.filter(s => s.date === today);
    const totalSeconds = todaySessions.reduce((acc, s) => acc + s.duration, 0);
    
    // Add current session time if running
    return totalSeconds + (isRunning ? elapsedTime : 0);
  }, [isAgent, agentId, sessions, isRunning, elapsedTime]);

  const value: TimeTrackingContextType = {
    isRunning,
    elapsedTime,
    startTimer,
    stopTimer,
    sessions,
    getAllSessions,
    getSessionsByAgent,
    getTimeByAgent,
    getTodayTime,
    formatTime,
  };

  return (
    <TimeTrackingContext.Provider value={value}>
      {children}
    </TimeTrackingContext.Provider>
  );
}

export function useTimeTracking(): TimeTrackingContextType {
  const context = useContext(TimeTrackingContext);
  if (!context) {
    throw new Error("useTimeTracking must be used within a TimeTrackingProvider");
  }
  return context;
}
