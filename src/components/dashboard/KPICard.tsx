import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'accent';
  onClick?: () => void;
}

const colorStyles = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', icon: 'text-primary' },
  success: { bg: 'bg-success/10', text: 'text-success', icon: 'text-success' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', icon: 'text-warning' },
  destructive: { bg: 'bg-destructive/10', text: 'text-destructive', icon: 'text-destructive' },
  accent: { bg: 'bg-accent/10', text: 'text-accent', icon: 'text-accent' },
};

export default function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color = 'primary',
  onClick 
}: KPICardProps) {
  const styles = colorStyles[color];

  return (
    <div 
      className={cn(
        "glass-card p-5 rounded-xl transition-all duration-300",
        onClick && "cursor-pointer hover:scale-[1.02] hover:shadow-lg"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}% from last period</span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", styles.bg)}>
          <Icon className={cn("w-6 h-6", styles.icon)} />
        </div>
      </div>
    </div>
  );
}
