import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTimeTracking } from '@/contexts/TimeTrackingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, Square, Clock, Calendar, Timer, Users } from 'lucide-react';

export default function TimeTrackingPage() {
  const { user } = useAuth();
  const { 
    isRunning, 
    elapsedTime, 
    startTimer, 
    stopTimer, 
    getTodayTime, 
    getAllSessions, 
    getSessionsByAgent,
    formatTime 
  } = useTimeTracking();

  const isAdmin = user?.role === 'ADMIN';
  const isAgent = user?.role === 'AGENT';
  const allSessions = getAllSessions();
  const todayTime = getTodayTime();

  // Calculate agent times for admin view
  const agentTimes = useMemo(() => {
    if (!isAdmin) return {};
    const times: Record<string, { agentName: string; totalSeconds: number }> = {};
    allSessions.forEach(session => {
      if (!times[session.agentId]) {
        times[session.agentId] = {
          agentName: session.agentName,
          totalSeconds: 0,
        };
      }
      times[session.agentId].totalSeconds += session.duration;
    });
    return times;
  }, [isAdmin, allSessions]);

  // Get user sessions
  const userSessions = useMemo(() => {
    if (!user?.id) return [];
    return isAdmin ? allSessions : getSessionsByAgent(user.id);
  }, [user?.id, isAdmin, allSessions, getSessionsByAgent]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Time Tracking</h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Monitor team time tracking' : 'Track your working hours'}
        </p>
      </div>

      {/* Timer Section (for Agents only) */}
      {isAgent && (
        <Card className="glass-card glow-primary">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <p className="text-sm text-muted-foreground mb-2">Current Session</p>
                <p className="text-5xl font-mono font-bold text-foreground">
                  {formatTime(isRunning ? elapsedTime : 0)}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Button
                  size="lg"
                  onClick={isRunning ? stopTimer : startTimer}
                  className={isRunning 
                    ? 'gradient-destructive text-destructive-foreground' 
                    : 'gradient-success text-success-foreground'
                  }
                >
                  {isRunning ? (
                    <>
                      <Square className="w-5 h-5 mr-2" />
                      Stop Timer
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Start Timer
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center md:text-right">
                <p className="text-sm text-muted-foreground mb-2">Today's Total</p>
                <p className="text-3xl font-mono font-semibold text-primary">
                  {formatTime(todayTime)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin View: All Agents Time */}
      {isAdmin && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Agent Time Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(agentTimes).length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No time tracking data available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Time data will appear when agents start tracking
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Agent</TableHead>
                    <TableHead className="text-muted-foreground">Total Time</TableHead>
                    <TableHead className="text-muted-foreground">Sessions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(agentTimes).map(([agentId, data]) => {
                    const agentSessions = allSessions.filter(s => s.agentId === agentId);
                    return (
                      <TableRow key={agentId} className="border-border">
                        <TableCell className="font-medium text-foreground">
                          {data.agentName}
                        </TableCell>
                        <TableCell className="font-mono text-primary">
                          {formatTime(data.totalSeconds)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {agentSessions.length} sessions
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Session History */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-accent" />
            {isAdmin ? 'All Sessions' : 'Your Session History'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userSessions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No sessions recorded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  {isAdmin && <TableHead className="text-muted-foreground">Agent</TableHead>}
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Start Time</TableHead>
                  <TableHead className="text-muted-foreground">End Time</TableHead>
                  <TableHead className="text-muted-foreground">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userSessions
                  .sort((a, b) => b.startTime - a.startTime)
                  .slice(0, 50)
                  .map((session) => (
                    <TableRow key={session.id} className="border-border">
                      {isAdmin && (
                        <TableCell className="font-medium text-foreground">
                          {session.agentName}
                        </TableCell>
                      )}
                      <TableCell className="text-foreground">{session.date}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(session.startTime).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(session.endTime).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="font-mono text-primary">
                        {formatTime(session.duration)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
