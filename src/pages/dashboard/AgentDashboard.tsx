import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { useAgents } from '@/contexts/AgentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Clock, 
  Calendar, 
  CheckCircle2,
  TrendingUp,
  Target,
  AlertCircle,
  ArrowRight,
  Phone,
  UserPlus
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { STATUS_COLORS, LeadStatus, SOURCE_COLORS, LeadSource } from '@/types/lead';

const STATUS_CHART_COLORS: Record<string, string> = {
  'new': '#3b82f6',
  'called': '#f97316',
  'missed': '#ef4444',
  'follow up': '#8b5cf6',
  'qualified': '#22c55e',
  'not interested': '#6b7280',
  'not qualified': '#94a3b8',
  'meeting booked': '#10b981',
};

export default function AgentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getAllLeads, getAgentStats } = useLeads();
  const { getAgentByEmail } = useAgents();

  const allLeads = getAllLeads();

  // Get current agent info
  const currentAgent = useMemo(() => {
    if (!user?.email) return null;
    return getAgentByEmail(user.email);
  }, [user, getAgentByEmail]);

  // Get leads assigned to this agent
  const myLeads = useMemo(() => {
    if (!user?.email && !user?.username) return [];
    
    return allLeads.filter(lead => {
      const assigned = lead.assignedAgent?.toLowerCase();
      return assigned === user.email?.toLowerCase() || 
             assigned === user.username?.toLowerCase() ||
             assigned === user.displayName?.toLowerCase();
    });
  }, [allLeads, user]);

  // Calculate agent-specific stats
  const agentStats = useMemo(() => {
    const total = myLeads.length;
    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    
    myLeads.forEach(lead => {
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
      bySource[lead.source] = (bySource[lead.source] || 0) + 1;
    });

    const inProgress = (byStatus['new'] || 0) + (byStatus['called'] || 0) + (byStatus['follow up'] || 0) + (byStatus['missed'] || 0);
    const closed = (byStatus['qualified'] || 0) + (byStatus['not qualified'] || 0) + (byStatus['not interested'] || 0);
    const meetings = byStatus['meeting booked'] || 0;
    const followUp = byStatus['follow up'] || 0;
    const newLeads = byStatus['new'] || 0;
    const called = byStatus['called'] || 0;

    const maxCapacity = currentAgent?.maxDailyLeads || 15;
    const capacityUsed = total;
    const capacityRemaining = Math.max(0, maxCapacity - capacityUsed);
    const capacityPercent = Math.min((capacityUsed / maxCapacity) * 100, 100);

    return {
      total,
      byStatus,
      bySource,
      inProgress,
      closed,
      meetings,
      followUp,
      newLeads,
      called,
      maxCapacity,
      capacityUsed,
      capacityRemaining,
      capacityPercent,
    };
  }, [myLeads, currentAgent]);

  // Status distribution for pie chart
  const statusData = useMemo(() => {
    return Object.entries(agentStats.byStatus)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        color: STATUS_CHART_COLORS[status] || '#6b7280',
      }));
  }, [agentStats.byStatus]);

  // Daily tasks checklist
  const dailyTasks = useMemo(() => [
    { 
      id: 1, 
      label: 'Review new leads', 
      count: agentStats.newLeads, 
      done: agentStats.newLeads === 0,
      icon: UserPlus,
      color: 'text-blue-500'
    },
    { 
      id: 2, 
      label: 'Call pending leads', 
      count: agentStats.newLeads + (agentStats.byStatus['missed'] || 0), 
      done: agentStats.newLeads === 0 && (agentStats.byStatus['missed'] || 0) === 0,
      icon: Phone,
      color: 'text-orange-500'
    },
    { 
      id: 3, 
      label: 'Follow up required', 
      count: agentStats.followUp, 
      done: agentStats.followUp === 0,
      icon: Clock,
      color: 'text-purple-500'
    },
    { 
      id: 4, 
      label: 'Check meetings today', 
      count: agentStats.meetings, 
      done: false,
      icon: Calendar,
      color: 'text-green-500'
    },
  ], [agentStats]);

  // Recent leads (last 5)
  const recentLeads = useMemo(() => {
    return myLeads.slice(0, 5);
  }, [myLeads]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-2 shadow-lg text-sm">
          <p className="font-medium text-foreground">{payload[0].name}: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const agentStatsData = useMemo(() => getAgentStats(), [getAgentStats]);

  // Format daily stats for display
  const dailyStatsArray = useMemo(() => {
    const entries = Object.entries(agentStatsData.dailyBySource)
      .map(([date, sources]) => ({
        date,
        sources: Object.entries(sources).map(([source, count]) => ({
          source,
          count,
        })),
        total: Object.values(sources).reduce((sum, c) => sum + c, 0),
      }))
      .sort((a, b) => b.date.localeCompare(a.date)); // Most recent first

    return entries.slice(0, 7); // Last 7 days
  }, [agentStatsData.dailyBySource]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {user?.displayName?.split(' ')[0] || 'Agent'}! 👋
          </h1>
          <p className="text-muted-foreground text-sm">Here's your activity summary for today</p>
        </div>
        <Button onClick={() => navigate('/dashboard/leads')} size="sm">
          View My Leads
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Capacity Card */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Daily Capacity</p>
                <p className="text-lg font-bold text-foreground">
                  {agentStats.capacityUsed} / {agentStats.maxCapacity} leads
                </p>
              </div>
            </div>
            <Badge className={cn(
              "text-sm px-3 py-1",
              agentStats.capacityPercent >= 100 ? 'bg-destructive/20 text-destructive' :
              agentStats.capacityPercent >= 80 ? 'bg-warning/20 text-warning' : 
              'bg-success/20 text-success'
            )}>
              {agentStats.capacityRemaining} slots available
            </Badge>
          </div>
          <Progress value={agentStats.capacityPercent} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      {/* Updated Stats Grid - Add Total Leads */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">My Leads</p>
                <p className="text-2xl font-bold text-foreground">{agentStatsData.totalLeads}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total assigned</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-foreground">{agentStats.inProgress}</p>
              </div>
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Meetings</p>
                <p className="text-2xl font-bold text-foreground">{agentStats.meetings}</p>
              </div>
              <div className="p-2 rounded-lg bg-accent/10">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Closed</p>
                <p className="text-2xl font-bold text-foreground">{agentStats.closed}</p>
              </div>
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NEW: Daily Leads Breakdown Section */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Daily Leads Activity (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyStatsArray.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No daily activity data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dailyStatsArray.map((day) => (
                <div key={day.date} className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {day.total} lead{day.total !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {day.sources.map(({ source, count }) => {
                      const sourceColor = SOURCE_COLORS[source as LeadSource];
                      return (
                        <div 
                          key={source}
                          className="flex items-center justify-between px-2 py-1 rounded bg-secondary/30"
                        >
                          <span className="text-xs text-muted-foreground truncate">
                            {source.replace(' Request', '').replace(' Form', '')}
                          </span>
                          <Badge className={cn("ml-1 text-xs", sourceColor?.bg, sourceColor?.text)}>
                            {count}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No leads assigned yet</p>
                </div>
              </div>
            ) : (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        dataKey="value"
                      >
                        {statusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {statusData.map(entry => (
                    <div key={entry.name} className="flex items-center gap-1 text-xs">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-muted-foreground">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Daily Tasks Checklist */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Daily Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailyTasks.map(task => {
                const Icon = task.icon;
                return (
                  <div 
                    key={task.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-colors",
                      task.done 
                        ? "bg-success/10 border-success/30" 
                        : task.count > 0 
                          ? "bg-warning/10 border-warning/30"
                          : "bg-secondary/30 border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        task.done ? "bg-success text-white" : "bg-muted"
                      )}>
                        {task.done ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Icon className={cn("w-4 h-4", task.color)} />
                        )}
                      </div>
                      <span className={cn(
                        "text-sm",
                        task.done && "line-through text-muted-foreground"
                      )}>
                        {task.label}
                      </span>
                    </div>
                    {task.count > 0 && !task.done && (
                      <Badge variant="outline" className="text-xs">
                        {task.count}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Recent Leads</span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/leads')} className="text-xs">
                View All →
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No leads assigned yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentLeads.map(lead => {
                  const statusColor = STATUS_COLORS[lead.status as LeadStatus];
                  const name = String(lead['Name'] || lead['Full Name'] || lead['Email'] || lead['Company'] || `Lead ${lead.id}`);
                  
                  return (
                    <div 
                      key={lead.id}
                      onClick={() => navigate('/dashboard/leads')}
                      className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{name}</p>
                          <p className="text-xs text-muted-foreground">
                            {lead.source?.replace(' Request', '').replace(' Form', '')}
                          </p>
                        </div>
                      </div>
                      <Badge className={cn("text-xs flex-shrink-0 ml-2", statusColor?.bg, statusColor?.text)}>
                        {lead.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Follow-up Alert - Only show if needed */}
      {agentStats.followUp > 0 && (
        <Card className="glass-card border-warning/30 bg-warning/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-warning flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Follow-up Required</p>
                  <p className="text-sm text-muted-foreground">
                    You have {agentStats.followUp} lead(s) that need follow-up
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate('/dashboard/leads?status=follow+up')} variant="outline" size="sm">
                View Leads
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
