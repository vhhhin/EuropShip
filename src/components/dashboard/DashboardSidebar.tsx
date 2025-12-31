import React, { useState } from 'react';
import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import euroshipLogo from '@/assets/euroship-logo.png';
import { 
  LayoutDashboard, 
  Users, 
  Calendar,
  List,
  CalendarDays,
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
  // { id: 'all', label: 'All Sources', fullName: null, color: null }, // <-- SUPPRIMÉ DÉFINITIVEMENT
  { id: 'email', label: 'Email', fullName: 'Email Request' as LeadSource, color: '#f97316' },
  { id: 'instagram', label: 'Instagram', fullName: 'Instagram Request' as LeadSource, color: '#e91e63' },
  { id: 'ecomvestors', label: 'Ecomvestors', fullName: 'Ecomvestors Form' as LeadSource, color: '#3b82f6' },
  { id: 'euroship', label: 'EuropShipp', fullName: 'EuroShip Form' as LeadSource, color: '#10b981' },
];

export default function DashboardSidebar() {
  const { user, logout } = useAuth();
  const { getStats, getMeetingBookedLeads, getActiveLeads, getLeadsBySource, getAllLeads } = useLeads();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isLeadsExpanded, setIsLeadsExpanded] = useState(true);
  const [isMeetingsExpanded, setIsMeetingsExpanded] = useState(true);

  const stats = getStats();
  const meetingLeads = getMeetingBookedLeads();
  const isLeadsActive = location.pathname.startsWith('/dashboard/leads');
  const isMeetingsActive = location.pathname.startsWith('/dashboard/meetings');
  const isAgent = user?.role === 'AGENT';

  // Plus besoin de filtrer, la source "all" n'existe plus
  const filteredLeadSubItems = LEAD_SUB_ITEMS;

  // Get count for each source - ALREADY CORRECT
  const getSourceCount = (fullName: LeadSource | null): number => {
    if (!fullName) {
      // All sources: TOTAL de TOUS les leads (Email + Instagram + Ecomvestors + EuroShip)
      return getAllLeads().length; // ✅ Ceci retourne le TOTAL RÉEL de TOUS les leads
    }
    // Specific source: leads de cette source (sauf meeting booked)
    return getLeadsBySource(fullName).filter(l => l.status !== 'meeting booked').length;
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-40">
      {/* Logo Section */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center p-1.5">
            <img 
              src={euroshipLogo} 
              alt="EuropShip" 
              className="w-full h-full object-contain invert"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">EuropShip</h1>
            <p className="text-xs text-muted-foreground">EuropShip</p>
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
              {filteredLeadSubItems.map((source) => {
                const count = getSourceCount(source.fullName);
                // Robustly check if this source is active in the URL
                const currentSource = searchParams.get('source');
                const isActive =
                  location.pathname === '/dashboard/leads' &&
                  currentSource === source.id;

                return (
                  <NavLink
                    key={source.id}
                    to={`/dashboard/leads?source=${source.id}`}
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

        {/* ============================================ */}
        {/* MEETINGS SECTION - SAME FOR AGENT AND ADMIN */}
        {/* ============================================ */}
        <div className="space-y-1">
          <button
            onClick={() => setIsMeetingsExpanded(!isMeetingsExpanded)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group",
              isMeetingsActive 
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg glow-primary" 
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Meetings</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded",
                isMeetingsActive ? "bg-white/20" : "bg-muted"
              )}>
                {meetingLeads.length}
              </span>
              {isMeetingsExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          </button>

          {/* MEETINGS SUB-SECTIONS: List and Agenda (same for Agent and Admin) */}
          {isMeetingsExpanded && (
            <div className="ml-4 pl-4 border-l border-sidebar-border space-y-1">
              {/* List Sub-section */}
              <NavLink
                to="/dashboard/meetings/list"
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <List className="w-4 h-4" />
                <span>List</span>
              </NavLink>

              {/* Agenda Sub-section */}
              <NavLink
                to="/dashboard/meetings/agenda"
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <CalendarDays className="w-4 h-4" />
                <span>Agenda</span>
              </NavLink>
            </div>
          )}
        </div>

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
              {user?.role === 'ADMIN' ? 'Administrator' : 'EuropShip Agent'}
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
