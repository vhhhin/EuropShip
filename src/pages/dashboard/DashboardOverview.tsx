import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { useAgents } from '@/contexts/AgentContext';
import { useLeadDistribution } from '@/hooks/useLeadDistribution';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  Users, 
  UserPlus, 
  Clock, 
  Calendar, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Users2,
  UserCheck,
  UserX,
  BarChart3,
  RefreshCw,
  Inbox
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';

// ============================================
// CONSTANTS
// ============================================

const STATUS_CHART_COLORS: Record<string, string> = {
  'new': '#3b82f6',
  'called': '#f97316',
  'missed': '#ef4444',
  'follow up': '#8b5cf6',
  'not interested': '#6b7280',
  'qualified': '#22c55e',
  'not qualified': '#94a3b8',
  'meeting booked': '#10b981',
};

const SOURCE_CHART_COLORS: Record<string, string> = {
  'Email Request': '#f97316',
  'Instagram Request': '#ec4899',
  'Ecomvestors Form': '#3b82f6',
  'EuroShip Form': '#10b981',
};

// ============================================
// COMPONENTS
// ============================================

function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'primary',
  subtitle,
  onClick 
}: { 
  title: string;
  value: number | string;
  icon: React.ElementType;
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'accent';
  subtitle?: string;
  onClick?: () => void;
}) {
  const colorStyles = {
    primary: { bg: 'bg-primary/10', icon: 'text-primary' },
    success: { bg: 'bg-success/10', icon: 'text-success' },
    warning: { bg: 'bg-warning/10', icon: 'text-warning' },
    destructive: { bg: 'bg-destructive/10', icon: 'text-destructive' },
    accent: { bg: 'bg-accent/10', icon: 'text-accent' },
  };
  const styles = colorStyles[color];

  return (
    <div 
      className={cn(
        "glass-card p-4 rounded-xl transition-all duration-300",
        onClick && "cursor-pointer hover:scale-[1.02] hover:shadow-lg"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn("p-2.5 rounded-lg", styles.bg)}>
          <Icon className={cn("w-5 h-5", styles.icon)} />
        </div>
      </div>
    </div>
  );
}

function ProgressCircle({ value, size = 80 }: { value: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 90 ? '#ef4444' : value >= 70 ? '#f97316' : '#22c55e';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={6} fill="none" className="text-muted/20" />
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} stroke={color} className="transition-all duration-500" />
      </svg>
      <span className="absolute text-sm font-bold text-foreground">{Math.round(value)}%</span>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-2 shadow-lg text-sm">
        <p className="font-medium text-foreground">{label || payload[0].name}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-muted-foreground">
            {entry.name}: <span className="font-semibold text-foreground">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function DashboardOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getStats, getAllLeads } = useLeads();
  const { agents } = useAgents();
  const { 
    getDistributionStats, 
    getAgentDistributionStats, 
    forceRedistribution,
    getUnassignedLeads 
  } = useLeadDistribution();
  
  const stats = getStats();
  const allLeads = getAllLeads();
  const isAdmin = user?.role === 'ADMIN';
  const distStats = getDistributionStats();
  const agentStats = getAgentDistributionStats();
  const unassignedLeads = getUnassignedLeads();

  // ============================================
  // LEADS DATA
  // ============================================
  
  const leadsKPIs = useMemo(() => ({
    total: stats.total,
    newLeads: stats.byStatus['new'] || 0,
    unassigned: unassignedLeads.length,
    followUp: stats.byStatus['follow up'] || 0,
    meetingBooked: stats.byStatus['meeting booked'] || 0,
    qualified: stats.byStatus['qualified'] || 0,
  }), [stats, unassignedLeads]);

  const statusData = useMemo(() => 
    Object.entries(stats.byStatus)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        color: STATUS_CHART_COLORS[status] || '#6b7280',
      }))
  , [stats.byStatus]);

  const sourceData = useMemo(() => 
    Object.entries(stats.bySource)
      .filter(([_, count]) => count > 0)
      .map(([source, count]) => ({
        name: source.replace(' Request', '').replace(' Form', ''),
        value: count,
        color: SOURCE_CHART_COLORS[source] || '#6b7280',
      }))
  , [stats.bySource]);

  const trendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day) => ({
      name: day,
      leads: Math.floor(stats.total / 7 + Math.random() * 5),
      qualified: Math.floor((stats.byStatus['qualified'] || 0) / 7 + Math.random() * 2),
    }));
  }, [stats]);

  // ============================================
  // AGENTS DATA
  // ============================================

  const agentKPIs = useMemo(() => ({
    total: agents.filter(a => a.status === 'active').length,
    available: distStats.agentsAvailable,
    full: distStats.agentsAtCapacity,
    avgUtil: distStats.utilizationRate,
  }), [agents, distStats]);

  const agentChartData = agentStats.slice(0, 6).map(a => ({
    name: a.firstName || 'Agent',
    leads: a.currentLeads,
    color: a.status === 'full' ? '#ef4444' : a.status === 'busy' ? '#f97316' : '#22c55e',
  }));

  const handleRedistribute = () => {
    const result = forceRedistribution();
    console.log(`Redistributed ${result.distributed} leads, ${result.remaining} remaining`);
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.displayName?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-muted-foreground text-sm">Here's your dashboard overview</p>
        </div>
        {isAdmin && unassignedLeads.length > 0 && (
          <Button onClick={handleRedistribute} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Redistribute ({unassignedLeads.length})
          </Button>
        )}
      </div>

      {/* ============================================ */}
      {/* SECTION 1: LEADS OVERVIEW */}
      {/* ============================================ */}
      
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Leads Overview</h2>
          <Badge variant="outline" className="text-xs">Live</Badge>
        </div>

        {/* Leads KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard title="Total Leads" value={leadsKPIs.total} icon={Users} color="primary" onClick={() => navigate('/dashboard/leads')} />
          <KPICard title="New" value={leadsKPIs.newLeads} icon={UserPlus} color="accent" />
          <KPICard 
            title="Unassigned" 
            value={leadsKPIs.unassigned} 
            icon={Inbox} 
            color={leadsKPIs.unassigned > 0 ? 'warning' : 'success'} 
            subtitle={leadsKPIs.unassigned > 0 ? 'Waiting distribution' : 'All assigned'}
          />
          <KPICard title="Follow Up" value={leadsKPIs.followUp} icon={Clock} color="accent" />
          <KPICard title="Meetings" value={leadsKPIs.meetingBooked} icon={Calendar} color="success" onClick={() => navigate('/dashboard/meetings')} />
          <KPICard title="Qualified" value={leadsKPIs.qualified} icon={CheckCircle2} color="success" />
        </div>

        {/* Leads Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Trend Chart */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Lead Trends (7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="leads" stroke="#f97316" strokeWidth={2} fill="url(#leadGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status Pie */}
          <Card className="glass-card">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Source Bar */}
        <Card className="glass-card">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Leads by Source</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData} layout="vertical">
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {sourceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* SECTION 2: AGENTS OVERVIEW (Admin Only) */}
      {/* ============================================ */}
      
      {isAdmin && (
        <>
          <Separator />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users2 className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-semibold text-foreground">Agents Overview</h2>
                <Badge variant="outline" className="text-xs">
                  {distStats.availableCapacity} slots available
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/agents')}>
                Manage Agents →
              </Button>
            </div>

            {/* Agents KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KPICard title="Active Agents" value={agentKPIs.total} icon={Users2} color="primary" />
              <KPICard title="Available" value={agentKPIs.available} icon={UserCheck} color="success" subtitle="Can take more leads" />
              <KPICard title="At Capacity" value={agentKPIs.full} icon={UserX} color={agentKPIs.full > 0 ? 'destructive' : 'success'} />
              <KPICard title="Utilization" value={`${agentKPIs.avgUtil}%`} icon={BarChart3} color={agentKPIs.avgUtil > 80 ? 'warning' : 'success'} />
            </div>

            {/* Agents Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Bar Chart */}
              <Card className="glass-card">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Leads per Agent</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={agentChartData}>
                        <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="leads" radius={[4, 4, 0, 0]}>
                          {agentChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Capacity Circles */}
              <Card className="glass-card">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Capacity Utilization</CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {agentStats.slice(0, 4).map((agent) => (
                      <div key={agent.id} className="flex flex-col items-center">
                        <ProgressCircle value={agent.utilization} />
                        <p className="text-xs font-medium text-foreground mt-2">{agent.firstName || 'Agent'}</p>
                        <p className="text-[10px] text-muted-foreground">{agent.currentLeads}/{agent.maxDailyLeads}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Agent List */}
            <Card className="glass-card">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Agent Status</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-2">
                  {agentStats.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                          {(agent.firstName?.charAt(0) || '') + (agent.lastName?.charAt(0) || '')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {agent.firstName || ''} {agent.lastName || ''}
                          </p>
                          <p className="text-xs text-muted-foreground">{agent.email || ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">{agent.currentLeads}/{agent.maxDailyLeads}</p>
                          <p className="text-[10px] text-muted-foreground">leads</p>
                        </div>
                        <div className="w-20">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full", 
                                agent.status === 'full' ? 'bg-destructive' :
                                agent.status === 'busy' ? 'bg-warning' : 'bg-success'
                              )}
                              style={{ width: `${agent.utilization}%` }}
                            />
                          </div>
                        </div>
                        <Badge className={cn("text-xs w-16 justify-center",
                          agent.status === 'full' ? 'bg-destructive/20 text-destructive' :
                          agent.status === 'busy' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                        )}>
                          {agent.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}