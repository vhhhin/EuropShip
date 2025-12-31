import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  List,
  CalendarDays,
  Bell,
  Settings,
  type LucideIcon
} from 'lucide-react';

export interface AgentNavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  children?: AgentNavItem[];
}

export const agentNavigation: AgentNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'leads',
    label: 'Leads',
    path: '/dashboard/leads',
    icon: Users,
  },
  {
    id: 'meetings',
    label: 'Meetings',
    path: '/dashboard/meetings',
    icon: Calendar,
    children: [
      {
        id: 'meetings-list',
        label: 'List',
        path: '/dashboard/meetings/list',
        icon: List,
      },
      {
        id: 'meetings-agenda',
        label: 'Agenda',
        path: '/dashboard/meetings/agenda',
        icon: CalendarDays,
      },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    path: '/dashboard/notifications',
    icon: Bell,
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/dashboard/settings',
    icon: Settings,
  },
];
