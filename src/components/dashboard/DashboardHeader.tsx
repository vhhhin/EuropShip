import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-3 sm:px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9 flex-shrink-0"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h2 className="font-semibold text-base sm:text-lg text-foreground truncate">
          {user?.role === 'ADMIN' ? 'Admin Dashboard' : 'Agent Dashboard'}
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
        {/* Notifications */}
        {user?.role === 'AGENT' && <NotificationDropdown />}
      </div>
    </header>
  );
}
