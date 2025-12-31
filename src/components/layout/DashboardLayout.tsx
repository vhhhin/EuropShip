import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLeads } from '@/hooks/useLeads';
import { LeadSource } from '@/types/lead';

// Source configuration
const LEAD_SUB_ITEMS = [
  { id: 'all', label: 'All Sources', fullName: null as LeadSource | null, color: null },
  { id: 'email', label: 'Email', fullName: 'Email Request' as LeadSource, color: '#f97316' },
  { id: 'instagram', label: 'Instagram', fullName: 'Instagram Request' as LeadSource, color: '#e91e63' },
  { id: 'ecomvestors', label: 'Ecomvestors', fullName: 'Ecomvestors Form' as LeadSource, color: '#3b82f6' },
  { id: 'euroship', label: 'EuroShip', fullName: 'EuroShip Form' as LeadSource, color: '#10b981' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { getStats, getActiveLeads, getLeadsBySource, getAllLeads } = useLeads();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['meetings', 'leads']);

  const isAgent = user?.role === 'AGENT';
  const stats = getStats();

  // Get count for each source - CORRECTED FOR ALL SOURCES
  const getSourceCount = (fullName: LeadSource | null): number => {
    if (!fullName) {
      // All sources: count ALL leads (including meeting booked) - TOTAL RÉEL
      return getAllLeads().length;
    }
    // Specific source: count leads from that source (excluding meeting booked)
    return getLeadsBySource(fullName).filter(l => l.status !== 'meeting booked').length;
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const isPathActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  // Render navigation item
  const renderNavItem = (
    id: string,
    label: string,
    path: string,
    Icon: React.ElementType,
    children?: { id: string; label: string; path: string; icon: React.ElementType }[]
  ) => {
    const hasChildren = children && children.length > 0;
    const isExpanded = expandedItems.includes(id);
    const isActive = isPathActive(path);
    const isChildActive = hasChildren && children.some(child => isPathActive(child.path));

    if (hasChildren) {
      return (
        <div key={id} className="space-y-1">
          <button
            onClick={() => toggleExpand(id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
              (isActive || isChildActive) && "bg-primary/10 text-primary"
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 text-left text-sm font-medium">{label}</span>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {isExpanded && (
            <div className="ml-4 space-y-1 border-l-2 border-border/50 pl-3">
              {children.map(child => {
                const ChildIcon = child.icon;
                return (
                  <NavLink
                    key={child.id}
                    to={child.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                      "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                      isPathActive(child.path) && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <ChildIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{child.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={id}
        to={path}
        end={path === '/dashboard'}
        onClick={() => setMobileMenuOpen(false)}
        className={({ isActive: linkActive }) => cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
          "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
          linkActive && "bg-primary/10 text-primary font-medium"
        )}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm">{label}</span>
      </NavLink>
    );
  };

  // Render Leads navigation with sub-items and counts
  const renderLeadsNav = () => {
    const isExpanded = expandedItems.includes('leads');
    const isActive = isPathActive('/dashboard/leads');

    return (
      <div key="leads" className="space-y-1">
        <button
          onClick={() => toggleExpand('leads')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
            isActive && "bg-primary/10 text-primary"
          )}
        >
          <Users className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1 text-left text-sm font-medium">Leads</span>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {isExpanded && (
          <div className="ml-4 space-y-1 border-l-2 border-border/50 pl-3">
            {LEAD_SUB_ITEMS.map(source => {
              const count = getSourceCount(source.fullName);
              const sourceActive = location.pathname === '/dashboard/leads' && 
                (location.search === `?source=${source.id}` || 
                 (source.id === 'all' && !location.search));
              
              return (
                <NavLink
                  key={source.id}
                  to={source.id === 'all' ? '/dashboard/leads' : `/dashboard/leads?source=${source.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200",
                    "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                    sourceActive && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {source.color && (
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: source.color }} />
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

  // Render sidebar navigation based on role
  const renderNavigation = () => (
    <nav className="space-y-1 px-2 py-4">
      {/* Dashboard */}
      {renderNavItem('dashboard', 'Dashboard', '/dashboard', LayoutDashboard)}

      {/* Leads with sub-sections and counts */}
      {renderLeadsNav()}

      {/* MEETINGS - WITH SUB-SECTIONS FOR AGENT */}
      {isAgent ? (
        // Agent: Meetings with List and Agenda sub-sections
        renderNavItem('meetings', 'Meetings', '/dashboard/meetings', Calendar, [
          { id: 'meetings-list', label: 'List', path: '/dashboard/meetings/list', icon: List },
          { id: 'meetings-agenda', label: 'Agenda', path: '/dashboard/meetings/agenda', icon: CalendarDays },
        ])
      ) : (
        // Admin: Simple Meetings link
        renderNavItem('meetings', 'Meetings', '/dashboard/meetings', Calendar)
      )}

      {/* Admin-only items */}
      {!isAgent && (
        <>
          {renderNavItem('analytics', 'Analytics', '/dashboard/analytics', BarChart3)}
          {renderNavItem('agents', 'Agents', '/dashboard/agents', UserCog)}
          {renderNavItem('distribution', 'Distribution', '/dashboard/distribution', Zap)}
        </>
      )}

      {/* Notifications */}
      {renderNavItem('notifications', 'Notifications', '/dashboard/notifications', Bell)}

      {/* Settings */}
      {renderNavItem('settings', 'Settings', '/dashboard/settings', Settings)}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">E</span>
            </div>
            <span className="font-semibold text-foreground hidden sm:block">EuroShip CRM</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {user?.displayName || user?.email}
          </span>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border transition-all duration-300 z-40",
        "w-64 hidden md:block"
      )}>
        <div className="h-full overflow-y-auto">
          {renderNavigation()}
        </div>
      </aside>

      {/* Sidebar - Mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border pt-16">
            <div className="h-full overflow-y-auto">
              {renderNavigation()}
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className={cn(
        "pt-16 min-h-screen transition-all duration-300",
        "md:ml-64"
      )}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}