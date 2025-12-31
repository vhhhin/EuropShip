import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTimeTracking } from '@/contexts/TimeTrackingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, Square, Clock, Calendar, Timer, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Time Tracking</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {isAdmin ? 'Monitor team time tracking' : 'Track your working hours'}
        </p>
      </div>

      {/* Timer Section (for Agents only) */}
      {isAgent && (
        <Card className="glass-card glow-primary">
          <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
              <div className="text-center sm:text-left w-full sm:w-auto">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Current Session</p>
                <p className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold text-foreground">
                  {formatTime(isRunning ? elapsedTime : 0)}
                </p>
              </div>
              
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center sm:justify-start">
                <Button
                  size="lg"
                  onClick={isRunning ? stopTimer : startTimer}
                  className={cn(
                    isRunning 
                      ? 'gradient-destructive text-destructive-foreground' 
                      : 'gradient-success text-success-foreground',
                    'w-full sm:w-auto'
                  )}
                >
                  {isRunning ? (
                    <>
                      <Square className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="text-sm sm:text-base">Stop Timer</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="text-sm sm:text-base">Start Timer</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center sm:text-right w-full sm:w-auto">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Today's Total</p>
                <p className="text-2xl sm:text-3xl font-mono font-semibold text-primary">
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
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              Agent Time Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {Object.keys(agentTimes).length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">No time tracking data available</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Time data will appear when agents start tracking
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground text-xs sm:text-sm">Agent</TableHead>
                        <TableHead className="text-muted-foreground text-xs sm:text-sm">Total Time</TableHead>
                        <TableHead className="text-muted-foreground text-xs sm:text-sm">Sessions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(agentTimes).map(([agentId, data]) => {
                        const agentSessions = allSessions.filter(s => s.agentId === agentId);
                        return (
                          <TableRow key={agentId} className="border-border">
                            <TableCell className="font-medium text-foreground text-xs sm:text-sm">
                              {data.agentName}
                            </TableCell>
                            <TableCell className="font-mono text-primary text-xs sm:text-sm">
                              {formatTime(data.totalSeconds)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs sm:text-sm">
                              {agentSessions.length} sessions
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Session History */}
      <Card className="glass-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
            <span className="truncate">{isAdmin ? 'All Sessions' : 'Your Session History'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {userSessions.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground">No sessions recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      {isAdmin && (
                        <TableHead className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                          Agent
                        </TableHead>
                      )}
                      <TableHead className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                        Date
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                        Start Time
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                        End Time
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                        Duration
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userSessions
                      .sort((a, b) => b.startTime - a.startTime)
                      .slice(0, 50)
                      .map((session) => (
                        <TableRow key={session.id} className="border-border">
                          {isAdmin && (
                            <TableCell className="font-medium text-foreground text-xs sm:text-sm whitespace-nowrap">
                              {session.agentName}
                            </TableCell>
                          )}
                          <TableCell className="text-foreground text-xs sm:text-sm whitespace-nowrap">
                            {session.date}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                            {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                            {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell className="font-mono text-primary text-xs sm:text-sm whitespace-nowrap">
                            {formatTime(session.duration)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
