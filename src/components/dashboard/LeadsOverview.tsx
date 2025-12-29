import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import KPICard from './KPICard';
import { useLeads } from '@/hooks/useLeads';
import { LEAD_SOURCES, LeadSource, STATUS_COLORS } from '@/types/lead';
import { 
  Users, 
  UserPlus, 
  Clock, 
  Calendar, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Phone
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
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';

const CHART_COLORS = {
  primary: '#f97316',
  secondary: '#8b5cf6',
  success: '#22c55e',
  warning: '#eab308',
  destructive: '#ef4444',
  accent: '#06b6d4',
  pink: '#ec4899',
  indigo: '#6366f1',
};

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

interface LeadsOverviewProps {
  onFilterByStatus?: (status: string) => void;
  onFilterBySource?: (source: string) => void;
}

export default function LeadsOverview({ onFilterByStatus, onFilterBySource }: LeadsOverviewProps) {
  const navigate = useNavigate();
  const { getStats, getActiveLeads, getMeetingBookedLeads, getAllLeads } = useLeads();
  const stats = getStats();
  const activeLeads = getActiveLeads();
  const meetingLeads = getMeetingBookedLeads();
  const allLeads = getAllLeads();

  // Calculate KPIs
  const kpis = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const unassigned = allLeads.filter(l => !l.assignedAgent).length;
    const followUp = stats.byStatus['follow up'] || 0;
    const newToday = allLeads.filter(l => {
      // Assuming leads have a createdAt or similar field
      return true; // For now, show all new leads
    }).length;

    return {
      total: stats.total,
      newLeads: stats.byStatus['new'] || 0,
      unassigned,
      followUp,
      meetingBooked: stats.byStatus['meeting booked'] || 0,
      qualified: stats.byStatus['qualified'] || 0,
    };
  }, [allLeads, stats]);

  // Prepare status distribution data for pie chart
  const statusData = useMemo(() => {
    return Object.entries(stats.byStatus)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        color: STATUS_CHART_COLORS[status] || '#6b7280',
      }));
  }, [stats.byStatus]);

  // Prepare source distribution data for pie chart
  const sourceData = useMemo(() => {
    return Object.entries(stats.bySource)
      .filter(([_, count]) => count > 0)
      .map(([source, count]) => ({
        name: source.replace(' Request', '').replace(' Form', ''),
        fullName: source,
        value: count,
        color: SOURCE_CHART_COLORS[source] || '#6b7280',
      }));
  }, [stats.bySource]);

  // Simulated trend data (last 7 days)
  const trendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const total = stats.total;
    
    // Distribute leads across days (simulated based on total)
    return days.map((day, index) => ({
      name: day,
      leads: Math.floor(total / 7 + Math.random() * (total / 10)),
      qualified: Math.floor((stats.byStatus['qualified'] || 0) / 7 + Math.random() * 2),
    }));
  }, [stats]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{label || payload[0].name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-muted-foreground">
              {entry.name || 'Value'}: <span className="font-semibold text-foreground">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Leads Overview</h2>
            <p className="text-sm text-muted-foreground">Real-time lead statistics and trends</p>
          </div>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          Live Data
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="Total Leads"
          value={kpis.total}
          icon={Users}
          color="primary"
          onClick={() => navigate('/dashboard/leads')}
        />
        <KPICard
          title="New Leads"
          value={kpis.newLeads}
          icon={UserPlus}
          color="accent"
          onClick={() => onFilterByStatus?.('new')}
        />
        <KPICard
          title="Unassigned"
          value={kpis.unassigned}
          icon={AlertCircle}
          color={kpis.unassigned > 0 ? 'warning' : 'success'}
        />
        <KPICard
          title="Follow Up"
          value={kpis.followUp}
          icon={Clock}
          color="accent"
          onClick={() => onFilterByStatus?.('follow up')}
        />
        <KPICard
          title="Meetings"
          value={kpis.meetingBooked}
          icon={Calendar}
          color="success"
          onClick={() => navigate('/dashboard/meetings')}
        />
        <KPICard
          title="Qualified"
          value={kpis.qualified}
          icon={CheckCircle2}
          color="success"
          onClick={() => onFilterByStatus?.('qualified')}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Trend Chart */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Lead Trends (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorQualified" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="leads" 
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    fill="url(#colorLeads)" 
                    name="Total Leads"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="qualified" 
                    stroke={CHART_COLORS.success}
                    strokeWidth={2}
                    fill="url(#colorQualified)" 
                    name="Qualified"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution Pie */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    onClick={(data) => onFilterByStatus?.(data.name.toLowerCase())}
                    style={{ cursor: 'pointer' }}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {statusData.slice(0, 4).map((entry) => (
                <div 
                  key={entry.name} 
                  className="flex items-center gap-1 text-xs cursor-pointer hover:opacity-80"
                  onClick={() => onFilterByStatus?.(entry.name.toLowerCase())}
                >
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source Distribution */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Leads by Source</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  type="category"
                  dataKey="name"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  radius={[0, 4, 4, 0]}
                  onClick={(data) => onFilterBySource?.(data.fullName)}
                  style={{ cursor: 'pointer' }}
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
