import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RefreshCw, Users } from 'lucide-react';
import { LeadsTable } from '../components/leads/LeadsTable';
import { LEAD_SOURCES, getSourceById } from '../config/leadSources';

interface LeadsPageProps {
  leads: any[];
  isLoading: boolean;
  onRefresh: () => void;
  onLeadClick: (lead: any) => void;
}

export const LeadsPage: React.FC<LeadsPageProps> = ({
  leads,
  isLoading,
  onRefresh,
  onLeadClick,
}) => {
  const { sourceId } = useParams<{ sourceId?: string }>();
  const navigate = useNavigate();
  
  const currentSource = sourceId ? getSourceById(sourceId) : null;
  
  // Calculate counts per source
  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    LEAD_SOURCES.forEach((source) => {
      counts[source.id] = leads.filter(
        (lead) => lead.source?.toLowerCase() === source.label.toLowerCase()
      ).length;
    });
    return counts;
  }, [leads]);
  
  // Filtered leads count
  const filteredCount = useMemo(() => {
    if (!sourceId) return leads.length;
    return sourceCounts[sourceId] || 0;
  }, [sourceId, leads.length, sourceCounts]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads Management</h1>
          <p className="text-gray-400 mt-1">View and manage all leads</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-200 transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Source Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => navigate('/leads')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !sourceId
              ? 'bg-orange-500 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          All Sources
        </button>
        {LEAD_SOURCES.map((source) => (
          <button
            key={source.id}
            onClick={() => navigate(`/leads/${source.id}`)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              sourceId === source.id
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {source.label}
            <span className="text-xs px-1.5 py-0.5 rounded bg-black/20">
              {sourceCounts[source.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Section Header */}
      <div className="flex items-center gap-3">
        <Users size={24} className="text-orange-500" />
        <h2 className="text-xl font-semibold text-white">
          {currentSource ? `${currentSource.label} Leads` : 'Leads'}{' '}
          <span className="text-gray-400">({filteredCount})</span>
        </h2>
        {currentSource && (
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: currentSource.color }}
          />
        )}
      </div>

      {/* Leads Table */}
      <LeadsTable
        leads={leads}
        sourceFilter={sourceId}
        onLeadClick={onLeadClick}
        isLoading={isLoading}
      />
    </div>
  );
};
