import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import euroshipLogo from '@/assets/euroship-logo.png';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Clock, 
  LogOut,
  ChevronDown,
  ChevronRight,
  Users2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadSource } from '@/types/lead';

// Source configuration for sub-menu
const LEAD_SUB_ITEMS = [
  { id: 'all', label: 'All Sources', fullName: null, color: null },
  { id: 'email', label: 'Email', fullName: 'Email Request' as LeadSource, color: '#f97316' },
  { id: 'instagram', label: 'Instagram', fullName: 'Instagram Request' as LeadSource, color: '#e91e63' },
  { id: 'ecomvestors', label: 'Ecomvestors', fullName: 'Ecomvestors Form' as LeadSource, color: '#3b82f6' },
  { id: 'euroship', label: 'EuroShip', fullName: 'EuroShip Form' as LeadSource, color: '#10b981' },
];

export default function DashboardSidebar() {
  const { user, logout } = useAuth();
  const { getStats } = useLeads();
  const location = useLocation();
  const [isLeadsExpanded, setIsLeadsExpanded] = useState(true);

  const stats = getStats();
  const isLeadsActive = location.pathname.startsWith('/dashboard/leads');

  // Get count for each source
  const getSourceCount = (fullName: LeadSource | null): number => {
    if (!fullName) return stats.total;
    return stats.bySource[fullName] || 0;
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-40">
      {/* Logo Section */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center p-1.5">
            <img 
              src={euroshipLogo} 
              alt="EuroShip" 
              className="w-full h-full object-contain invert"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">EuroShip</h1>
            <p className="text-xs text-muted-foreground">Lead Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Dashboard Link */}
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
            isActive 
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg glow-primary" 
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </NavLink>

        {/* Leads Section with Sub-menu */}
        <div className="space-y-1">
          {/* Leads Main Item - Expandable */}
          <button
            onClick={() => setIsLeadsExpanded(!isLeadsExpanded)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group",
              isLeadsActive 
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg glow-primary" 
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              <span className="font-medium">Leads</span>
            </div>
            {isLeadsExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* Leads Sub-items */}
          {isLeadsExpanded && (
            <div className="ml-4 pl-4 border-l border-sidebar-border space-y-1">
              {LEAD_SUB_ITEMS.map((source) => {
                const count = getSourceCount(source.fullName);
                // Use search params to track active source
                const isActive = location.pathname === '/dashboard/leads' && 
                  (location.search === `?source=${source.id}` || 
                   (source.id === 'all' && !location.search));
                
                return (
                  <NavLink
                    key={source.id}
                    to={source.id === 'all' ? '/dashboard/leads' : `/dashboard/leads?source=${source.id}`}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm",
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {source.color && (
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: source.color }}
                        />
                      )}
                      <span>{source.label}</span>
                    </div>
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded",
                      isActive ? "bg-primary/30" : "bg-muted"
                    )}>
                      {count}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>

        {/* Agents (Admin Only) */}
        {user?.role === 'ADMIN' && (
          <NavLink
            to="/dashboard/agents"
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
              isActive 
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg glow-primary" 
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Users2 className="w-5 h-5" />
            <span className="font-medium">Agents</span>
          </NavLink>
        )}

        {/* Meetings */}
        <NavLink
          to="/dashboard/meetings"
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
            isActive 
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg glow-primary" 
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Calendar className="w-5 h-5" />
          <span className="font-medium">Meetings</span>
        </NavLink>

        {/* Time Tracking */}
        <NavLink
          to="/dashboard/time"
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
            isActive 
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg glow-primary" 
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Clock className="w-5 h-5" />
          <span className="font-medium">Time Tracking</span>
        </NavLink>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
            {user?.displayName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-sidebar-foreground truncate">
              {user?.displayName}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.role === 'ADMIN' ? 'Administrator' : 'Sales Agent'}
            </p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
