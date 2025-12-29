import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, ChevronDown, ChevronRight } from 'lucide-react';
import { LEAD_SOURCES } from '../../config/leadSources';

interface LeadsNavItemProps {
  leadCounts?: Record<string, number>;
  totalCount?: number;
}

export const LeadsNavItem: React.FC<LeadsNavItemProps> = ({ 
  leadCounts = {}, 
  totalCount = 0 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  const isLeadsActive = location.pathname.startsWith('/leads');
  
  const handleMainClick = () => {
    setIsExpanded(!isExpanded);
  };
  
  const handleAllLeadsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/leads');
  };
  
  const handleSourceClick = (sourceId: string) => {
    navigate(`/leads/${sourceId}`);
  };
  
  return (
    <div className="w-full">
      {/* Main Leads Item */}
      <div
        onClick={handleMainClick}
        className={`flex items-center justify-between w-full px-4 py-3 cursor-pointer transition-colors rounded-lg ${
          isLeadsActive
            ? 'bg-orange-500 text-white'
            : 'text-gray-300 hover:bg-gray-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <Users size={20} />
          <span className="font-medium">Leads</span>
          {totalCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-gray-700 text-gray-300">
              {totalCount}
            </span>
          )}
        </div>
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </div>
      
      {/* Sub-sections */}
      {isExpanded && (
        <div className="ml-4 mt-1 space-y-1">
          {/* All Sources */}
          <div
            onClick={handleAllLeadsClick}
            className={`flex items-center justify-between px-4 py-2 cursor-pointer rounded-lg transition-colors ${
              location.pathname === '/leads'
                ? 'bg-orange-500/20 text-orange-400 border-l-2 border-orange-500'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
            }`}
          >
            <span className="text-sm">All Sources</span>
          </div>
          
          {/* Individual Sources */}
          {LEAD_SOURCES.map((source) => (
            <div
              key={source.id}
              onClick={() => handleSourceClick(source.id)}
              className={`flex items-center justify-between px-4 py-2 cursor-pointer rounded-lg transition-colors ${
                location.pathname === `/leads/${source.id}`
                  ? 'bg-orange-500/20 text-orange-400 border-l-2 border-orange-500'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: source.color }}
                />
                <span className="text-sm">{source.label}</span>
              </div>
              {leadCounts[source.id] !== undefined && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">
                  {leadCounts[source.id]}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
