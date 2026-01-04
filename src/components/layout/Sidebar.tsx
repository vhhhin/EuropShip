import React, { useState, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  List,
  CalendarDays,
  BarChart3,
  Settings,
  Bell,
  UserCog,
  Zap,
  ChevronDown,
  ChevronRight,
  type LucideIcon
} from 'lucide-react';
import { LeadSource } from '@/types/lead';

// Source configuration
const LEAD_SUB_ITEMS = [
  { id: 'all', label: 'All Sources', fullName: null as LeadSource | null, color: null },
  { id: 'email', label: 'Email', fullName: 'Email Request' as LeadSource, color: '#f97316' },
  { id: 'instagram', label: 'Instagram', fullName: 'Instagram Request' as LeadSource, color: '#e91e63' },
  { id: 'ecomvestors', label: 'Ecomvestors', fullName: 'Ecomvestors Form' as LeadSource, color: '#3b82f6' },
  { id: 'euroship', label: 'EuroShip', fullName: 'EuroShip Form' as LeadSource, color: '#10b981' },
];

interface SidebarProps {
  collapsed?: boolean;
  onNavClick?: () => void;
}

export default function Sidebar({ collapsed = false, onNavClick }: SidebarProps) {
  const { user } = useAuth();
  const { getStats, getActiveLeads, getLeadsBySource, getMeetingBookedLeads, updateTrigger } = useLeads();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['meetings', 'leads']);

  const isAgent = user?.role === 'AGENT';
  const stats = getStats();
  // CRITICAL: Get fresh meetings data - depends on updateTrigger
  // RÉUTILISATION EXACTE de la logique de MeetingsListPage.tsx (ligne 28-30)
  const meetingLeads = useMemo(() => {
    return getMeetingBookedLeads();
  }, [getMeetingBookedLeads, updateTrigger]);

  // Get count for each source - MUST match LeadsPage logic
  const getSourceCount = (fullName: LeadSource | null): number => {
    if (!fullName) {
      return getActiveLeads().length;
    }
    return getLeadsBySource(fullName).filter(l => !l.hasMeeting).length;
  };

  // Toggle expand/collapse for items with children
  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Check if path is active
  const isPathActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  // Render a single nav item (with or without children)
  const renderNavLink = (
    id: string,
    label: string,
    path: string,
    Icon: LucideIcon,
    isChild = false
  ) => {
    return (
      <NavLink
        key={id}
        to={path}
        end={path === '/dashboard'}
        onClick={onNavClick}
        className={({ isActive }) => cn(
          "flex items-center gap-3 rounded-lg transition-all duration-200",
          "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
          isChild ? "px-3 py-2" : "px-3 py-2.5",
          isActive && "bg-primary/10 text-primary font-medium"
        )}
      >
        <Icon className={cn("flex-shrink-0", isChild ? "w-4 h-4" : "w-5 h-5")} />
        {!collapsed && <span className="text-sm">{label}</span>}
      </NavLink>
    );
  };

  // Render a single nav item with count badge
  const renderNavLinkWithCount = (
    id: string,
    label: string,
    path: string,
    Icon: LucideIcon,
    count: number
  ) => {
    return (
      <NavLink
        key={id}
        to={path}
        end={path === '/dashboard'}
        onClick={onNavClick}
        className={({ isActive }) => cn(
          "flex items-center justify-between gap-3 rounded-lg transition-all duration-200",
          "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
          "px-3 py-2.5",
          isActive && "bg-primary/10 text-primary font-medium"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">{label}</span>}
        </div>
      </NavLink>
    );
  };

  // Render expandable section with children and count badge
  const renderExpandableSectionWithCount = (
    id: string,
    label: string,
    path: string,
    Icon: LucideIcon,
    count: number,
    children: { id: string; label: string; path: string; icon: LucideIcon }[]
  ) => {
    const isExpanded = expandedItems.includes(id);
    const isActive = isPathActive(path);
    const isChildActive = children.some(child => isPathActive(child.path));

    return (
      <div key={id} className="space-y-1">
        <button
          onClick={(e) => toggleExpand(id, e)}
          className={cn(
            "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
            (isActive || isChildActive) && "bg-primary/10 text-primary"
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left text-sm font-medium">{label}</span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </>
            )}
          </div>
        </button>

        {/* Render children when expanded */}
        {!collapsed && isExpanded && (
          <div className="ml-4 space-y-1 border-l-2 border-border/50 pl-3">
            {children.map(child => (
              <NavLink
                key={child.id}
                to={child.path}
                onClick={onNavClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                  "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                  isPathActive(child.path) && "bg-primary/10 text-primary font-medium"
                )}
              >
                <child.icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{child.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render expandable section with children (without count - for backward compatibility)
  const renderExpandableSection = (
    id: string,
    label: string,
    path: string,
    Icon: LucideIcon,
    children: { id: string; label: string; path: string; icon: LucideIcon }[]
  ) => {
    const isExpanded = expandedItems.includes(id);
    const isActive = isPathActive(path);
    const isChildActive = children.some(child => isPathActive(child.path));

    return (
      <div key={id} className="space-y-1">
        <button
          onClick={(e) => toggleExpand(id, e)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
            (isActive || isChildActive) && "bg-primary/10 text-primary"
          )}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left text-sm font-medium">{label}</span>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </>
          )}
        </button>

        {/* Render children when expanded */}
        {!collapsed && isExpanded && (
          <div className="ml-4 space-y-1 border-l-2 border-border/50 pl-3">
            {children.map(child => (
              <NavLink
                key={child.id}
                to={child.path}
                onClick={onNavClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                  "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                  isPathActive(child.path) && "bg-primary/10 text-primary font-medium"
                )}
              >
                <child.icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{child.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render expandable Leads section with source counts
  const renderLeadsSection = () => {
    const isExpanded = expandedItems.includes('leads');
    const isActive = isPathActive('/dashboard/leads');

    return (
      <div key="leads" className="space-y-1">
        <button
          onClick={(e) => toggleExpand('leads', e)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
            isActive && "bg-primary/10 text-primary"
          )}
        >
          <Users className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left text-sm font-medium">Leads</span>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </>
          )}
        </button>

        {/* Leads Sub-items with counts */}
        {!collapsed && isExpanded && (
          <div className="ml-4 space-y-1 border-l-2 border-border/50 pl-3">
            {LEAD_SUB_ITEMS.map((source) => {
              const count = getSourceCount(source.fullName);
              const sourceActive = location.pathname === '/dashboard/leads' && 
                (location.search === `?source=${source.id}` || 
                 (source.id === 'all' && !location.search));
              
              return (
                <NavLink
                  key={source.id}
                  to={source.id === 'all' ? '/dashboard/leads' : `/dashboard/leads?source=${source.id}`}
                  onClick={onNavClick}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200",
                    "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                    sourceActive && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {source.color && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: source.color }}
                      />
                    )}
                    <span className="text-sm">{source.label}</span>
                  </div>
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded",
                    sourceActive ? "bg-primary/30" : "bg-muted"
                  )}>
                    {count}
                  </span>
                </NavLink>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="space-y-1 px-2 py-4">
      {/* Dashboard */}
      {renderNavLink('dashboard', 'Dashboard', '/dashboard', LayoutDashboard)}

      {/* Leads with sub-sections and counts */}
      {renderLeadsSection()}

      {/* MEETINGS - DIFFERENT FOR AGENT vs ADMIN */}
      {isAgent ? (
        renderExpandableSection('meetings', 'Meetings', '/dashboard/meetings', Calendar, [
          { id: 'meetings-list', label: 'List', path: '/dashboard/meetings/list', icon: List },
          { id: 'meetings-agenda', label: 'Agenda', path: '/dashboard/meetings/agenda', icon: CalendarDays },
        ])
      ) : (
        renderNavLink('meetings', 'Meetings', '/dashboard/meetings', Calendar)
      )}

      {/* Admin-only items */}
      {!isAgent && (
        <>
          {renderNavLink('analytics', 'Analytics', '/dashboard/analytics', BarChart3)}
          {renderNavLink('agents', 'Agents', '/dashboard/agents', UserCog)}
          {renderNavLink('distribution', 'Distribution', '/dashboard/distribution', Zap)}
        </>
      )}

      {/* Notifications */}
      {renderNavLink('notifications', 'Notifications', '/dashboard/notifications', Bell)}

      {/* Settings */}
      {renderNavLink('settings', 'Settings', '/dashboard/settings', Settings)}
    </nav>
  );
}
