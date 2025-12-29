import React, { useState } from 'react';
import { useAgents } from '@/contexts/AgentContext';
import { useLeadDistribution } from '@/hooks/useLeadDistribution';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Users2, 
  UserPlus, 
  Trash2, 
  RefreshCw,
  UserCheck,
  UserX,
  Target,
  Edit,
  Inbox
} from 'lucide-react';
import { Agent, AgentRole, AgentStatus } from '@/types/agent';

export default function AgentsPage() {
  const { user } = useAuth();
  const { agents, addAgent, updateAgent, deleteAgent, setAgentStatus, getAgentStats } = useAgents();
  const { toast } = useToast();

  // Initialize distribution hook
  let distStats = { unassignedLeads: 0, totalCapacity: 0, usedCapacity: 0, availableCapacity: 0, utilizationRate: 0 };
  let agentDistributionStats: any[] = [];
  let forceRedistributionFn = () => ({ distributed: 0, remaining: 0 });

  try {
    const distribution = useLeadDistribution();
    distStats = distribution.getDistributionStats();
    agentDistributionStats = distribution.getAgentDistributionStats();
    forceRedistributionFn = distribution.forceRedistribution;
  } catch (e) {
    console.log('Lead distribution not available');
  }

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'AGENT' as AgentRole,
    status: 'active' as AgentStatus,
    maxDailyLeads: 10,
  });

  const agentStats = getAgentStats();

  // Only admins can access this page
  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Users2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">Agent management is only available for administrators.</p>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'AGENT',
      status: 'active',
      maxDailyLeads: 10,
    });
  };

  const handleAddAgent = () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    addAgent(formData);
    toast({ title: 'Success', description: 'Agent added successfully' });
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleEditAgent = () => {
    if (!editingAgent) return;

    updateAgent(editingAgent.id, formData);
    toast({ title: 'Success', description: 'Agent updated successfully' });
    setEditingAgent(null);
    resetForm();
  };

  const handleDeleteAgent = (agent: Agent) => {
    if (confirm(`Are you sure you want to delete ${agent.firstName} ${agent.lastName}?`)) {
      deleteAgent(agent.id);
      toast({ title: 'Success', description: 'Agent deleted successfully' });
    }
  };

  const handleToggleStatus = (agent: Agent) => {
    const newStatus = agent.status === 'active' ? 'inactive' : 'active';
    setAgentStatus(agent.id, newStatus);
    toast({ title: 'Success', description: `Agent ${newStatus === 'active' ? 'activated' : 'deactivated'}` });
  };

  const handleForceRedistribution = () => {
    const result = forceRedistributionFn();
    toast({ 
      title: 'Redistribution Complete', 
      description: `Distributed ${result.distributed} leads. ${result.remaining} remaining in pool.` 
    });
  };

  const openEditModal = (agent: Agent) => {
    setFormData({
      firstName: agent.firstName || '',
      lastName: agent.lastName || '',
      email: agent.email || '',
      role: agent.role || 'AGENT',
      status: agent.status || 'active',
      maxDailyLeads: agent.maxDailyLeads || 10,
    });
    setEditingAgent(agent);
  };

  const getAgentInitials = (agent: Agent): string => {
    const first = agent.firstName?.charAt(0) || '';
    const last = agent.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '??';
  };

  const getAgentFullName = (agent: Agent): string => {
    const first = agent.firstName || '';
    const last = agent.lastName || '';
    return `${first} ${last}`.trim() || 'Unknown Agent';
  };

  // Get current leads for an agent from distribution stats
  const getAgentCurrentLeads = (agentId: string): number => {
    const found = agentDistributionStats.find(a => a.id === agentId);
    return found?.currentLeads || 0;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agent Management</h1>
          <p className="text-muted-foreground">Manage your sales team and lead distribution</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleForceRedistribution} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Redistribute ({distStats.unassignedLeads})
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Agent
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Agents</p>
                <p className="text-2xl font-bold text-foreground">{agentStats.totalAgents}</p>
              </div>
              <Users2 className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Agents</p>
                <p className="text-2xl font-bold text-foreground">{agentStats.activeAgents}</p>
              </div>
              <UserCheck className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Capacity</p>
                <p className="text-2xl font-bold text-foreground">{agentStats.totalCapacity}</p>
              </div>
              <Target className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Unassigned Leads</p>
                <p className="text-2xl font-bold text-foreground">{distStats.unassignedLeads}</p>
              </div>
              <Inbox className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold text-foreground">{agentStats.inactiveAgents}</p>
              </div>
              <UserX className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users2 className="w-5 h-5 text-primary" />
            Agents ({agents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <div className="text-center py-12">
              <Users2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No agents yet</p>
              <p className="text-sm text-muted-foreground mt-1">Add your first agent to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agents.map((agent) => {
                const currentLeads = getAgentCurrentLeads(agent.id);
                const maxLeads = agent.maxDailyLeads || 10;
                const utilization = maxLeads > 0 ? (currentLeads / maxLeads) * 100 : 0;
                const status = agent.status === 'inactive' ? 'inactive' :
                              utilization >= 100 ? 'full' : 
                              utilization >= 80 ? 'busy' : 'available';

                return (
                  <div key={agent.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm",
                        agent.status === 'active' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      )}>
                        {getAgentInitials(agent)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{getAgentFullName(agent)}</p>
                        <p className="text-sm text-muted-foreground">{agent.email || 'No email'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Lead Count */}
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{currentLeads} / {maxLeads}</p>
                        <p className="text-xs text-muted-foreground">leads assigned</p>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-24">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full transition-all",
                              status === 'inactive' ? 'bg-muted-foreground' :
                              status === 'full' ? 'bg-destructive' :
                              status === 'busy' ? 'bg-warning' : 'bg-success'
                            )}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Status Badge */}
                      <Badge className={cn("w-20 justify-center",
                        status === 'inactive' ? 'bg-muted text-muted-foreground' :
                        status === 'full' ? 'bg-destructive/20 text-destructive' :
                        status === 'busy' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                      )}>
                        {status}
                      </Badge>

                      {/* Actions */}
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEditModal(agent)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleToggleStatus(agent)}>
                          {agent.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteAgent(agent)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Agent Modal */}
      <Dialog open={isAddModalOpen || !!editingAgent} onOpenChange={(open) => {
        if (!open) {
          setIsAddModalOpen(false);
          setEditingAgent(null);
          resetForm();
        }
      }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editingAgent ? 'Edit Agent' : 'Add New Agent'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input 
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input 
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Smith"
                />
              </div>
            </div>
            
            <div>
              <Label>Email</Label>
              <Input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@euroship.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData(prev => ({ ...prev, role: v as AgentRole }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AGENT">Agent</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Max Daily Leads</Label>
                <Input 
                  type="number"
                  min={1}
                  max={100}
                  value={formData.maxDailyLeads}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxDailyLeads: parseInt(e.target.value) || 10 }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddModalOpen(false);
              setEditingAgent(null);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={editingAgent ? handleEditAgent : handleAddAgent}>
              {editingAgent ? 'Save Changes' : 'Add Agent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
