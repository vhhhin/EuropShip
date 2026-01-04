import React, { useState, useEffect, useMemo } from 'react';
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
  Users2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadSource } from '@/types/lead';

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

// Source configuration for sub-menu
const LEAD_SUB_ITEMS = [
  // { id: 'all', label: 'All Sources', fullName: null, color: null }, // <-- SUPPRIMÉ DÉFINITIVEMENT
  { id: 'email', label: 'Email', fullName: 'Email Request' as LeadSource, color: '#f97316' },
  { id: 'instagram', label: 'Instagram', fullName: 'Instagram Request' as LeadSource, color: '#e91e63' },
  { id: 'ecomvestors', label: 'Ecomvestors', fullName: 'Ecomvestors Form' as LeadSource, color: '#3b82f6' },
  { id: 'euroship', label: 'EuropShipp', fullName: 'EuroShip Form' as LeadSource, color: '#10b981' },
];

export default function DashboardSidebar({ isOpen = false, onClose }: DashboardSidebarProps) {
  const { user, logout } = useAuth();
  const { getStats, getMeetingBookedLeads, getActiveLeads, getLeadsBySource, getAllLeads, mergedLeads, updateTrigger } = useLeads();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isLeadsExpanded, setIsLeadsExpanded] = useState(true);
  const [isMeetingsExpanded, setIsMeetingsExpanded] = useState(true);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isOpen && onClose) {
      onClose();
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = getStats();
  // CRITICAL: Get fresh meetings data - depends on updateTrigger
  // RÉUTILISATION EXACTE de la logique de MeetingsListPage.tsx (ligne 28-30)
  const meetingLeads = useMemo(() => {
    return getMeetingBookedLeads();
  }, [getMeetingBookedLeads, updateTrigger]);
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
    // Specific source: leads de cette source (sauf ceux dans le tableau Meetings)
    return getLeadsBySource(fullName).filter(l => !l.hasMeeting).length;
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Logo Section */}
      <div className="p-4 sm:p-6 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-card border border-border flex items-center justify-center p-1 sm:p-1.5">
            <img 
              src={euroshipLogo} 
              alt="EuropShip" 
              className="w-full h-full object-contain invert"
            />
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg text-sidebar-foreground">EuropShip</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">EuropShip</p>
          </div>
        </div>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 sm:p-4 space-y-1 overflow-y-auto">
        {/* Dashboard Link */}
        <NavLink
          to="/dashboard"
          end
          onClick={onClose}
          className={({ isActive }) => cn(
            "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 group",
            isActive 
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg glow-primary" 
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="font-medium text-sm sm:text-base">Dashboard</span>
        </NavLink>

        {/* Leads Section with Sub-menu */}
        <div className="space-y-1">
          {/* Leads Main Item - Expandable */}
          <button
            onClick={() => setIsLeadsExpanded(!isLeadsExpanded)}
            className={cn(
              "w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 group",
              isLeadsActive 
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg glow-primary" 
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base">Leads</span>
            </div>
            {isLeadsExpanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
          </button>

          {/* Leads Sub-items */}
          {isLeadsExpanded && (
            <div className="ml-2 sm:ml-4 pl-2 sm:pl-4 border-l border-sidebar-border space-y-1">
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
                    onClick={onClose}
                    className={cn(
                      "flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm",
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      {source.color && (
                        <span
                          className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: source.color }}
                        />
                      )}
                      <span className="truncate">{source.label}</span>
                    </div>
                    <span className={cn(
                      "text-xs px-1 sm:px-1.5 py-0.5 rounded flex-shrink-0 ml-1",
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
            onClick={onClose}
            className={({ isActive }) => cn(
              "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 group",
              isActive 
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg glow-primary" 
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Users2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base">Agents</span>
          </NavLink>
        )}

        {/* ============================================ */}
        {/* MEETINGS SECTION - SAME FOR AGENT AND ADMIN */}
        {/* ============================================ */}
        <div className="space-y-1">
          <button
            onClick={() => setIsMeetingsExpanded(!isMeetingsExpanded)}
            className={cn(
              "w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 group",
              isMeetingsActive 
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg glow-primary" 
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="font-medium text-sm sm:text-base">Meetings</span>
            </div>
            {isMeetingsExpanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
          </button>

          {/* MEETINGS SUB-SECTIONS: List and Agenda (same for Agent and Admin) */}
          {isMeetingsExpanded && (
            <div className="ml-2 sm:ml-4 pl-2 sm:pl-4 border-l border-sidebar-border space-y-1">
              {/* List Sub-section */}
              <NavLink
                to="/dashboard/meetings/list"
                onClick={onClose}
                className={({ isActive }) => cn(
                  "flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm",
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <List className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>List</span>
              </NavLink>

              {/* Agenda Sub-section */}
              <NavLink
                to="/dashboard/meetings/agenda"
                onClick={onClose}
                className={({ isActive }) => cn(
                  "flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm",
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Agenda</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Time Tracking */}
        <NavLink
          to="/dashboard/time"
          onClick={onClose}
          className={({ isActive }) => cn(
            "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 group",
            isActive 
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg glow-primary" 
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="font-medium text-sm sm:text-base">Time Tracking</span>
        </NavLink>
      </nav>

      {/* User Section */}
      <div className="p-3 sm:p-4 border-t border-sidebar-border space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm sm:text-base flex-shrink-0">
            {user?.displayName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-xs sm:text-sm text-sidebar-foreground truncate">
              {user?.displayName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.role === 'ADMIN' ? 'Administrator' : 'EuropShip Agent'}
            </p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors text-sm sm:text-base"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
