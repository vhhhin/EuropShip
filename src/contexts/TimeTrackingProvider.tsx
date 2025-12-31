import React, { useState, useRef, useEffect } from 'react';
import { TimeTrackingContext } from './TimeTrackingContext';
import { useAuth } from '@/contexts/AuthContext';

type Session = {
  id: string;
  agentId: string;
  date: string;
  startTime: number;
  endTime: number;
  duration: number;
};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export function TimeTrackingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isAgent = user?.role === 'AGENT' && user?.email === 'agent.euroship';
  const agentId = user?.id;

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessions, setSessions] = useState<Session[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<number | null>(null);

  // Load sessions for agent
  useEffect(() => {
    if (!isAgent || !agentId) return;
    const data = localStorage.getItem(`agent_sessions_${agentId}`);
    setSessions(data ? JSON.parse(data) : []);
  }, [isAgent, agentId]);

  // Save sessions for agent
  useEffect(() => {
    if (!isAgent || !agentId) return;
    localStorage.setItem(`agent_sessions_${agentId}`, JSON.stringify(sessions));
  }, [sessions, isAgent, agentId]);

  // Timer logic only for agents
  useEffect(() => {
    if (!isAgent) return;
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isAgent]);

  const startTimer = () => {
    if (!isAgent) return;
    if (!isRunning) {
      sessionStartRef.current = Date.now() - elapsedTime * 1000;
      setIsRunning(true);
    }
  };

  const pauseTimer = () => {
    if (!isAgent) return;
    if (isRunning && sessionStartRef.current) {
      setElapsedTime(Math.floor((Date.now() - sessionStartRef.current) / 1000));
      setIsRunning(false);
    }
  };

  const stopTimer = () => {
    if (!isAgent) return;
    if (isRunning && sessionStartRef.current) {
      const now = Date.now();
      const duration = Math.floor((now - sessionStartRef.current) / 1000) + elapsedTime;
      const session: Session = {
        id: `session-${Date.now()}`,
        agentId,
        date: getToday(),
        startTime: sessionStartRef.current,
        endTime: now,
        duration,
      };
      setSessions((prev) => [...prev, session]);
      setElapsedTime(0);
      setIsRunning(false);
      sessionStartRef.current = null;
    } else if (!isRunning && elapsedTime > 0 && sessionStartRef.current) {
      const now = Date.now();
      const session: Session = {
        id: `session-${Date.now()}`,
        agentId,
        date: getToday(),
        startTime: sessionStartRef.current,
        endTime: now,
        duration: elapsedTime,
      };
      setSessions((prev) => [...prev, session]);
      setElapsedTime(0);
      sessionStartRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const value: TimeTrackingContextType = {
    isRunning,
    elapsedTime,
    startTimer,
    pauseTimer,
    stopTimer,
    formatTime,
    sessions,
  };

  return (
    <TimeTrackingContext.Provider value={value}>
      {children}
    </TimeTrackingContext.Provider>
  );
}