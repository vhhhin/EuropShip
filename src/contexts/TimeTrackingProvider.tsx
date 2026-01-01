import React, { useState, useRef, useEffect } from 'react';
import { TimeTrackingContext } from './TimeTrackingContext';
import { useAuth } from '@/contexts/AuthContext';

type Session = {
  id: string;
  agentId: string;
  date: string;
  startTime: number;
  endTime: number | null;
  duration: number;
};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 🔒 GARANTIE :
 * - Une seule session active MAX
 * - Garde la plus récente
 * - Supprime définitivement les autres
 */
function normalizeSessions(sessions: Session[], agentId: string): Session[] {
  const agentSessions = sessions.filter(s => s.agentId === agentId);

  const ended = agentSessions.filter(s => s.endTime !== null);
  const active = agentSessions
    .filter(s => s.endTime === null)
    .sort((a, b) => b.startTime - a.startTime)[0];

  return active ? [...ended, active] : ended;
}

export function TimeTrackingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isAgent = user?.role === 'AGENT';
  const agentId = user?.id;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const initializedRef = useRef(false);

  /* =========================
     🔥 INITIALISATION HARD
     ========================= */
  useEffect(() => {
    if (!isAgent || !agentId || initializedRef.current) return;
    initializedRef.current = true;

    const raw = localStorage.getItem(`agent_sessions_${agentId}`);
    const stored: Session[] = raw ? JSON.parse(raw) : [];

    const cleaned = normalizeSessions(stored, agentId);

    // 🔥 HARD RESET (supprime le timer blanc)
    setSessions(cleaned);
    setIsRunning(false);
    setElapsedTime(0);
    sessionStartRef.current = null;

    localStorage.setItem(
      `agent_sessions_${agentId}`,
      JSON.stringify(cleaned)
    );

    const active = cleaned.find(s => s.endTime === null);
    if (active) {
      sessionStartRef.current = active.startTime;
      setElapsedTime(Math.floor((Date.now() - active.startTime) / 1000));
      setIsRunning(true);
    }
  }, [isAgent, agentId]);

  /* =========================
     ⏱ TIMER
     ========================= */
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  /* =========================
     ▶ START
     ========================= */
  const startTimer = () => {
    if (!isAgent || !agentId) return;

    // 🔒 BLOQUER toute duplication
    if (sessions.some(s => s.endTime === null)) return;

    const now = Date.now();

    const session: Session = {
      id: `session-${now}`,
      agentId,
      date: getToday(),
      startTime: now,
      endTime: null,
      duration: 0,
    };

    const updated = normalizeSessions([...sessions, session], agentId);

    setSessions(updated);
    setIsRunning(true);
    setElapsedTime(0);
    sessionStartRef.current = now;

    localStorage.setItem(
      `agent_sessions_${agentId}`,
      JSON.stringify(updated)
    );
  };

  /* =========================
     ⏸ PAUSE
     ========================= */
  const pauseTimer = () => {
    if (!isRunning || !sessionStartRef.current) return;
    setElapsedTime(Math.floor((Date.now() - sessionStartRef.current) / 1000));
    setIsRunning(false);
  };

  /* =========================
     ⏹ STOP
     ========================= */
  const stopTimer = () => {
    if (!sessionStartRef.current || !agentId) return;

    const now = Date.now();
    const duration = Math.floor((now - sessionStartRef.current) / 1000);

    const endedSessions = sessions.map(s =>
      s.endTime === null
        ? { ...s, endTime: now, duration }
        : s
    );

    const cleaned = normalizeSessions(endedSessions, agentId);

    setSessions(cleaned);
    setIsRunning(false);
    setElapsedTime(0);
    sessionStartRef.current = null;

    localStorage.setItem(
      `agent_sessions_${agentId}`,
      JSON.stringify(cleaned)
    );
  };

  const formatTime = (seconds: number) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const value = {
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
