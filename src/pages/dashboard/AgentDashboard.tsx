import React, { useMemo, useState, useEffect } from 'react';
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
  const { subscribeToLeads, getAgentStats } = useLeads();
  const { getAgentByEmail } = useAgents();

  // --- State local pour les leads, mis à jour en temps réel via subscribeToLeads ---
  const [allLeads, setAllLeads] = useState<any[]>([]);
  useEffect(() => {
    const unsubscribe = subscribeToLeads(setAllLeads);
    return unsubscribe;
  }, [subscribeToLeads]);

  // Agent courant
  const currentAgent = useMemo(() => {
    if (!user?.email) return null;
    return getAgentByEmail(user.email);
  }, [user, getAgentByEmail]);

  // Leads assignés à cet agent
  const myLeads = useMemo(() => {
    if (!user?.email && !user?.username) return [];
    return allLeads.filter(lead => {
      const assigned = lead.assignedAgent?.toLowerCase();
      return assigned === user.email?.toLowerCase() ||
             assigned === user.username?.toLowerCase() ||
             assigned === user.displayName?.toLowerCase();
    });
  }, [allLeads, user]);

  // Stats de l'agent
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

  // Status data pour le pie chart
  const statusData = useMemo(() => {
    return Object.entries(agentStats.byStatus)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        color: STATUS_CHART_COLORS[status] || '#6b7280',
      }));
  }, [agentStats.byStatus]);

  // Daily tasks
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

  // Recent leads
  const recentLeads = useMemo(() => myLeads.slice(0, 5), [myLeads]);

  // Tooltip personnalisé pour PieChart
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

  // Agent stats data from hook
  const agentStatsData = useMemo(() => getAgentStats(), [getAgentStats]);

  // Daily stats last 7 days
  const dailyStatsArray = useMemo(() => {
    const entries = Object.entries(agentStatsData.dailyBySource || {})
      .map(([date, sources]) => ({
        date,
        sources: Object.entries(sources).map(([source, count]) => ({ source, count })),
        total: Object.values(sources).reduce((sum, c) => sum + c, 0),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
    return entries.slice(0, 7);
  }, [agentStatsData.dailyBySource]);

  // --- ✅ Correction clé : Calcul des nouveaux leads du jour ---
  const todayNewLeads = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const counts: Record<string, number> = {};
    allLeads.forEach(lead => {
      // Recherche champ date (robuste)
      let leadDate: string | null = null;
      const dateFields = ['createdAt', 'Date', 'date', 'Created Date', 'created date', 'Timestamp', 'Created', 'created_at', 'createdAt'];
      for (const field of dateFields) {
        if (lead[field]) {
          const parsed = new Date(String(lead[field]));
          if (!isNaN(parsed.getTime())) {
            leadDate = parsed.toISOString().split('T')[0];
            break;
          }
        }
      }
      if (leadDate === todayStr) {
        const source = lead.source || 'Unknown';
        counts[source] = (counts[source] || 0) + 1;
      }
    });
    return counts;
  }, [allLeads]);

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

      {/* Stats Grid */}
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

      {/* Pie Chart et Daily Tasks ... (reste inchangé) */}
      {/* ... */}
    </div>
  );
}
