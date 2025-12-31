import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, Pause, Clock, Calendar, Timer, Users } from 'lucide-react';

export default function TimeTrackingPage() {
  const { user } = useAuth();
  const { isRunning, elapsedTime, startTimer, pauseTimer, stopTimer, formatTime, sessions } = useTimeTracking();

  const isAdmin = user?.role === 'ADMIN';
  const isAgent = user?.role === 'AGENT' && user?.email === 'agent.euroship';

  // For admin, get all agent sessions (mock or from context, assuming sessions are per agent)
  const allSessions = isAdmin ? sessions : sessions.filter(s => s.agentId === user?.id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Time Tracking</h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Monitor team time tracking' : 'Track your working hours'}
        </p>
      </div>

      {/* Timer Section (for Agents) */}
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
                  onClick={isRunning ? pauseTimer : startTimer}
                  className={isRunning 
                    ? 'gradient-destructive text-destructive-foreground' 
                    : 'gradient-success text-success-foreground'
                  }
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
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
                  {formatTime(sessions.filter(s => s.date === new Date().toISOString().slice(0, 10)).reduce((sum, s) => sum + s.duration, 0))}
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
            {allSessions.length === 0 ? (
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
                  {/* Group by agent */}
                  {Object.entries(
                    allSessions.reduce((acc, session) => {
                      if (!acc[session.agentId]) acc[session.agentId] = { total: 0, count: 0, name: 'Agent' };
                      acc[session.agentId].total += session.duration;
                      acc[session.agentId].count += 1;
                      return acc;
                    }, {} as Record<string, { total: number; count: number; name: string }>)
                  ).map(([agentId, data]) => (
                    <TableRow key={agentId} className="border-border">
                      <TableCell className="font-medium text-foreground">
                        {data.name}
                      </TableCell>
                      <TableCell className="font-mono text-primary">
                        {formatTime(data.total)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {data.count} sessions
                      </TableCell>
                    </TableRow>
                  ))}
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
          {allSessions.length === 0 ? (
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
                {allSessions
                  .sort((a, b) => b.startTime - a.startTime)
                  .slice(0, 20)
                  .map((session) => (
                    <TableRow key={session.id} className="border-border">
                      {isAdmin && (
                        <TableCell className="font-medium text-foreground">
                          Agent
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
