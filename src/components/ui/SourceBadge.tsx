import React from 'react';
import { getSourceByLabel, LEAD_SOURCES } from '../../config/leadSources';

interface SourceBadgeProps {
  source: string;
  className?: string;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source, className = '' }) => {
  const sourceConfig = getSourceByLabel(source);
  
  const bgColor = sourceConfig?.color || '#6b7280';
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      {source}
    </span>
  );
};
