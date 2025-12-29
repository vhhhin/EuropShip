import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAgents } from '@/contexts/AgentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Shield, Key, Save, Camera, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useAuth();
  const { getAgentByEmail, updateAgent } = useAgents();
  const { toast } = useToast();

  const currentAgent = user?.email ? getAgentByEmail(user.email) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: currentAgent?.firstName || user?.displayName?.split(' ')[0] || '',
    lastName: currentAgent?.lastName || user?.displayName?.split(' ').slice(1).join(' ') || '',
    email: currentAgent?.email || user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleSaveProfile = () => {
    if (currentAgent) {
      updateAgent(currentAgent.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      });
    }
    setIsEditing(false);
    toast({ title: 'Profile Updated', description: 'Your profile has been saved successfully.' });
  };

  const handleCancelEdit = () => {
    setFormData({
      firstName: currentAgent?.firstName || user?.displayName?.split(' ')[0] || '',
      lastName: currentAgent?.lastName || user?.displayName?.split(' ').slice(1).join(' ') || '',
      email: currentAgent?.email || user?.email || '',
    });
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    if (!passwordData.currentPassword) {
      toast({ title: 'Error', description: 'Please enter your current password', variant: 'destructive' });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: 'Error', description: 'New passwords do not match', variant: 'destructive' });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }
    toast({ title: 'Password Changed', description: 'Your password has been updated successfully.' });
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordForm(false);
  };

  const permissions = user?.role === 'ADMIN' ? [
    { label: 'View all leads', allowed: true },
    { label: 'Manage agents', allowed: true },
    { label: 'View analytics', allowed: true },
    { label: 'System settings', allowed: true },
  ] : [
    { label: 'View assigned leads', allowed: true },
    { label: 'Update lead status', allowed: true },
    { label: 'Add notes to leads', allowed: true },
    { label: 'Schedule meetings', allowed: true },
    { label: 'View own performance', allowed: true },
    { label: 'Manage other agents', allowed: false },
    { label: 'View all leads', allowed: false },
    { label: 'System settings', allowed: false },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      {/* Profile Card */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Personal Information
          </CardTitle>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveProfile}>
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-3xl font-bold text-white">
                {(formData.firstName?.charAt(0) || 'U').toUpperCase()}
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-muted transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            <div>
              <p className="font-semibold text-lg text-foreground">
                {formData.firstName} {formData.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{formData.email}</p>
              <Badge className="mt-2" variant="outline">
                {user?.role === 'ADMIN' ? 'Administrator' : 'Sales Agent'}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">First Name</Label>
              {isEditing ? (
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-foreground font-medium">{formData.firstName || '-'}</p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground">Last Name</Label>
              {isEditing ? (
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-foreground font-medium">{formData.lastName || '-'}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <Label className="text-muted-foreground">Email Address</Label>
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@euroship.com"
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-foreground font-medium">{formData.email || '-'}</p>
              )}
            </div>
          </div>

          {currentAgent && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Daily Lead Capacity</Label>
                  <p className="mt-1 text-foreground font-medium">{currentAgent.maxDailyLeads} leads</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Account Status</Label>
                  <Badge className={cn("mt-1", currentAgent.status === 'active' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground')}>
                    {currentAgent.status}
                  </Badge>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Role & Permissions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" />
            Role & Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <div>
                <p className="font-medium text-foreground">Account Role</p>
                <p className="text-sm text-muted-foreground">Your access level in the system</p>
              </div>
              <Badge variant="outline" className="text-base px-3 py-1">
                {user?.role === 'ADMIN' ? 'Administrator' : 'Sales Agent'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {permissions.map((perm, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "p-3 rounded-lg flex items-center gap-2",
                    perm.allowed ? "bg-success/10" : "bg-muted/50"
                  )}
                >
                  {perm.allowed ? (
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <p className={cn(
                    "text-sm font-medium",
                    perm.allowed ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {perm.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-warning" />
            Security
          </CardTitle>
          {!showPasswordForm && (
            <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>
              Change Password
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {showPasswordForm ? (
            <div className="space-y-4">
              <div>
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="••••••••"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="••••••••"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Confirm New Password</Label>
                  <Input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="••••••••"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}>
                  Cancel
                </Button>
                <Button onClick={handleChangePassword}>
                  <Key className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              <p>Password last changed: Never</p>
              <p className="mt-1">We recommend changing your password regularly for security.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
