import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import KPICard from './KPICard';
import ProgressCircle from './ProgressCircle';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UserCheck, 
  UserX, 
  Users2,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

// Agent configuration (in production, this would come from a database)
interface Agent {
  id: string;
  name: string;
  email: string;
  maxCapacity: number;
  isActive: boolean;
}

// Simulated agents data (replace with real data source)
const AGENTS: Agent[] = [
  { id: 'agent-1', name: 'John Smith', email: 'john@euroship.com', maxCapacity: 50, isActive: true },
  { id: 'agent-2', name: 'Sarah Johnson', email: 'sarah@euroship.com', maxCapacity: 40, isActive: true },
  { id: 'agent-3', name: 'Mike Wilson', email: 'mike@euroship.com', maxCapacity: 45, isActive: true },
  { id: 'agent-4', name: 'Emma Brown', email: 'emma@euroship.com', maxCapacity: 35, isActive: true },
];

export default function AgentsOverview() {
  const { user } = useAuth();
  const { getAllLeads } = useLeads();
  const allLeads = getAllLeads();

  // Calculate agent statistics
  const agentStats = useMemo(() => {
    const stats = AGENTS.map(agent => {
      const assignedLeads = allLeads.filter(lead => 
        lead.assignedAgent === agent.name || 
        lead.assignedAgent === agent.email
      ).length;
      
      const utilization = (assignedLeads / agent.maxCapacity) * 100;
      const status = utilization >= 100 ? 'full' : utilization >= 80 ? 'busy' : 'available';

      return {
        ...agent,
        assignedLeads,
        utilization: Math.min(utilization, 100),
        status,
        available: agent.maxCapacity - assignedLeads,
      };
    });

    return stats.sort((a, b) => b.assignedLeads - a.assignedLeads);
  }, [allLeads]);

  // KPIs
  const kpis = useMemo(() => {
    const activeAgents = agentStats.filter(a => a.isActive).length;
    const fullCapacity = agentStats.filter(a => a.status === 'full').length;
    const available = agentStats.filter(a => a.status === 'available').length;
    const totalCapacity = agentStats.reduce((sum, a) => sum + a.maxCapacity, 0);
    const totalAssigned = agentStats.reduce((sum, a) => sum + a.assignedLeads, 0);

    return {
      activeAgents,
      fullCapacity,
      available,
      avgUtilization: totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0,
    };
  }, [agentStats]);

  // Chart data
  const chartData = agentStats.map(agent => ({
    name: agent.name.split(' ')[0],
    leads: agent.assignedLeads,
    capacity: agent.maxCapacity,
    color: agent.status === 'full' ? '#ef4444' : agent.status === 'busy' ? '#f97316' : '#22c55e',
  }));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'full':
        return <Badge className="bg-destructive/20 text-destructive border-0">Full</Badge>;
      case 'busy':
        return <Badge className="bg-warning/20 text-warning border-0">Busy</Badge>;
      default:
        return <Badge className="bg-success/20 text-success border-0">Available</Badge>;
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Assigned: <span className="font-semibold text-foreground">{data.leads}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Capacity: <span className="font-semibold text-foreground">{data.capacity}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Only show for admins
  if (user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Users2 className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Agents Overview</h2>
            <p className="text-sm text-muted-foreground">Team capacity and performance</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Active Agents"
          value={kpis.activeAgents}
          icon={Users2}
          color="primary"
        />
        <KPICard
          title="Available"
          value={kpis.available}
          icon={UserCheck}
          color="success"
        />
        <KPICard
          title="At Full Capacity"
          value={kpis.fullCapacity}
          icon={UserX}
          color={kpis.fullCapacity > 0 ? 'destructive' : 'success'}
        />
        <KPICard
          title="Avg. Utilization"
          value={`${kpis.avgUtilization}%`}
          icon={BarChart3}
          color={kpis.avgUtilization > 80 ? 'warning' : 'success'}
        />
      </div>

      {/* Charts and Agent Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Comparison Chart */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-accent" />
              Leads per Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
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
                  <Bar dataKey="leads" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Agent Capacity Circles */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Capacity Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {agentStats.slice(0, 4).map((agent) => (
                <div key={agent.id} className="flex flex-col items-center">
                  <ProgressCircle
                    value={agent.utilization}
                    size={100}
                    strokeWidth={8}
                    color={
                      agent.status === 'full' ? 'destructive' : 
                      agent.status === 'busy' ? 'warning' : 'success'
                    }
                  />
                  <p className="text-sm font-medium text-foreground mt-2">
                    {agent.name.split(' ')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {agent.assignedLeads}/{agent.maxCapacity} leads
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent List */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Agent Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {agentStats.map((agent) => (
              <div 
                key={agent.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="font-semibold text-primary">
                      {agent.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{agent.name}</p>
                    <p className="text-sm text-muted-foreground">{agent.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {agent.assignedLeads} / {agent.maxCapacity}
                    </p>
                    <p className="text-xs text-muted-foreground">Leads assigned</p>
                  </div>
                  <div className="w-24">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          agent.status === 'full' ? 'bg-destructive' :
                          agent.status === 'busy' ? 'bg-warning' : 'bg-success'
                        )}
                        style={{ width: `${agent.utilization}%` }}
                      />
                    </div>
                  </div>
                  {getStatusBadge(agent.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
