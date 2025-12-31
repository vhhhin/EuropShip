import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { agentNavigation, AgentNavItem } from '@/config/agentNavigation';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface AgentSidebarNavProps {
  collapsed?: boolean;
  onNavClick?: () => void;
}

export default function AgentSidebarNav({ collapsed = false, onNavClick }: AgentSidebarNavProps) {
  const location = useLocation();
  // Default expand meetings section
  const [expandedItems, setExpandedItems] = useState<string[]>(['meetings']);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const isPathActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const renderNavItem = (item: AgentNavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isActive = isPathActive(item.path);
    const Icon = item.icon;

    // Parent item with children (like Meetings)
    if (hasChildren) {
      const isChildActive = item.children!.some(child => isPathActive(child.path));
      
      return (
        <div key={item.id} className="space-y-1">
          <button
            onClick={(e) => toggleExpand(item.id, e)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
              (isActive || isChildActive) && "bg-primary/10 text-primary"
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                <span className="transition-transform duration-200">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </span>
              </>
            )}
          </button>
          
          {/* Children (sub-sections) */}
          {!collapsed && isExpanded && (
            <div className="ml-4 space-y-1 border-l-2 border-border/50 pl-3 animate-fade-in">
              {item.children!.map(child => {
                const ChildIcon = child.icon;
                const childActive = isPathActive(child.path);
                
                return (
                  <NavLink
                    key={child.id}
                    to={child.path}
                    onClick={onNavClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                      "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                      childActive && "bg-primary/10 text-primary font-medium"
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

    // Regular nav item without children
    return (
      <NavLink
        key={item.id}
        to={item.path}
        end={item.path === '/dashboard'}
        onClick={onNavClick}
        className={({ isActive: linkActive }) => cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
          "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
          linkActive && "bg-primary/10 text-primary font-medium"
        )}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span className="text-sm">{item.label}</span>}
      </NavLink>
    );
  };

  return (
    <nav className="space-y-1 px-2 py-2">
      {agentNavigation.map(item => renderNavItem(item))}
    </nav>
  );
}
