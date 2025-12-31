export interface Session {
  id: string;
  agentId: string;
  agentName: string;
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: number; // Unix timestamp in milliseconds
  endTime: number; // Unix timestamp in milliseconds
  duration: number; // Duration in seconds
}

export interface TimeTrackingContextType {
  // Timer state
  isRunning: boolean;
  elapsedTime: number; // Current session elapsed time in seconds
  
  // Timer controls
  startTimer: () => void;
  stopTimer: () => void;
  
  // Session data
  sessions: Session[];
  getAllSessions: () => Session[];
  getSessionsByAgent: (agentId: string) => Session[];
  getTimeByAgent: () => Record<string, { agentName: string; totalSeconds: number }>;
  getTodayTime: () => number; // Total time today in seconds
  
  // Utilities
  formatTime: (seconds: number) => string;
}

