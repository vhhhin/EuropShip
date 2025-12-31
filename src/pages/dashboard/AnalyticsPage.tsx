import React from 'react';
import { useLeads } from '@/hooks/useLeads';
import { useTimeTracking } from '@/contexts/TimeTrackingContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LEAD_SOURCES, LEAD_STATUSES, LeadSource, LeadStatus, SOURCE_COLORS, STATUS_COLORS } from '@/types/lead';
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
import { TrendingUp, Users, Calendar, Clock, Star, Target, Zap, Activity } from 'lucide-react';

const CHART_COLORS = ['#f97316', '#8b5cf6', '#22c55e', '#eab308', '#ef4444', '#06b6d4', '#ec4899', '#6366f1'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { getStats, getAllLeads, getMeetingBookedLeads } = useLeads();
  const { getTimeByAgent, formatTime } = useTimeTracking();
  
  const stats = getStats();
  const allLeads = getAllLeads();
  const meetingLeads = getMeetingBookedLeads();
  const agentTimes = getTimeByAgent();

  // Prepare chart data
  const statusData = Object.entries(stats.byStatus)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      fill: CHART_COLORS[LEAD_STATUSES.indexOf(status as LeadStatus) % CHART_COLORS.length]
    }));

  const sourceData = Object.entries(stats.bySource).map(([source, count], index) => ({
    name: source.replace(' Request', '').replace(' Form', ''),
    leads: count,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  }));

  const agentTimeData = Object.entries(agentTimes).map(([agentId, data]) => ({
    name: data.agentName,
    hours: Math.round(data.totalSeconds / 3600 * 100) / 100,
  }));

  // Calculate conversion rates
  const totalLeads = stats.total || 1;
  const qualifiedRate = Math.round((stats.byStatus['qualified'] / totalLeads) * 100);
  const meetingRate = Math.round((stats.byStatus['meeting booked'] / totalLeads) * 100);
  const notInterestedRate = Math.round((stats.byStatus['not interested'] / totalLeads) * 100);

  const conversionData = [
    { name: 'Qualified', rate: qualifiedRate, color: '#22c55e' },
    { name: 'Meeting Booked', rate: meetingRate, color: '#8b5cf6' },
    { name: 'Not Interested', rate: notInterestedRate, color: '#ef4444' },
  ];

  // Summary cards
  const summaryCards = [
    { 
      title: 'Total Leads', 
      value: stats.total, 
      icon: Users, 
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      change: '+12%',
      positive: true
    },
    { 
      title: 'Qualified Rate', 
      value: `${qualifiedRate}%`, 
      icon: Star, 
      color: 'text-success',
      bgColor: 'bg-success/10',
      change: '+5%',
      positive: true
    },
    { 
      title: 'Meeting Rate', 
      value: `${meetingRate}%`, 
      icon: Calendar, 
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      change: '+8%',
      positive: true
    },
    { 
      title: 'Active Pipeline', 
      value: allLeads.length - meetingLeads.length, 
      icon: Activity, 
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      change: '-3%',
      positive: false
    },
  ];

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">Analytics are only available for administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive insights into your sales performance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={card.title} className="glass-card animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{card.value}</p>
                  <p className={`text-xs mt-1 ${card.positive ? 'text-success' : 'text-destructive'}`}>
                    {card.change} from last month
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Leads by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Source Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-warning" />
              Leads by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Bar dataKey="leads" radius={[0, 4, 4, 0]}>
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Rates */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              Conversion Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    unit="%"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: number) => `${value}%`}
                  />
                  <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                    {conversionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Agent Time Tracking */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              Agent Time Tracking (Hours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agentTimeData.length === 0 ? (
              <div className="h-72 flex items-center justify-center">
                <div className="text-center">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No time tracking data yet</p>
                </div>
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agentTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                      formatter={(value: number) => `${value} hours`}
                    />
                    <Bar dataKey="hours" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
