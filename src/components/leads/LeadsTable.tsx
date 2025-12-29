import React, { useMemo, useState } from 'react';
import { ChevronRight, Filter } from 'lucide-react';
import { SourceBadge } from '../ui/SourceBadge';
import { getSourceByLabel } from '../../config/leadSources';

interface Lead {
  id: string;
  fullName: string;
  phone: string;
  source: string;
  experiencedInEcommerce: string;
  budgetRange: string;
  status: string;
  [key: string]: any;
}

interface LeadsTableProps {
  leads: Lead[];
  sourceFilter?: string; // 'email' | 'instagram' | 'ecomvestors' | 'euroship' | undefined (all)
  onLeadClick?: (lead: Lead) => void;
  isLoading?: boolean;
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  new: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  called: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  'meeting booked': { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  'follow up': { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  qualified: { bg: 'bg-green-500/20', text: 'text-green-400' },
  closed: { bg: 'bg-red-500/20', text: 'text-red-400' },
};

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  sourceFilter,
  onLeadClick,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Filter leads by source and search
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Source filter
      if (sourceFilter) {
        const sourceConfig = getSourceByLabel(lead.source);
        if (sourceConfig?.id !== sourceFilter) return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = lead.fullName?.toLowerCase().includes(query);
        const matchesPhone = lead.phone?.toLowerCase().includes(query);
        if (!matchesName && !matchesPhone) return false;
      }
      
      // Status filter
      if (statusFilter !== 'all') {
        if (lead.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }
      
      return true;
    });
  }, [leads, sourceFilter, searchQuery, statusFilter]);
  
  const getStatusStyle = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || 'new';
    return STATUS_STYLES[normalizedStatus] || STATUS_STYLES.new;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="called">Called</option>
            <option value="meeting booked">Meeting Booked</option>
            <option value="follow up">Follow Up</option>
            <option value="qualified">Qualified</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Full Name</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Phone</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Source</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Experienced in E-commerce</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Budget Range</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Status</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead, index) => {
              const statusStyle = getStatusStyle(lead.status);
              return (
                <tr
                  key={lead.id || index}
                  onClick={() => onLeadClick?.(lead)}
                  className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-4 text-gray-200">{lead.fullName}</td>
                  <td className="px-4 py-4 text-gray-300">{lead.phone}</td>
                  <td className="px-4 py-4">
                    <SourceBadge source={lead.source} />
                  </td>
                  <td className="px-4 py-4 text-gray-300">{lead.experiencedInEcommerce}</td>
                  <td className="px-4 py-4 text-gray-300">{lead.budgetRange}</td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <ChevronRight size={16} className="text-gray-500" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredLeads.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No leads found
          </div>
        )}
      </div>
      
      {/* Lead Count */}
      <div className="text-sm text-gray-500">
        Showing {filteredLeads.length} of {leads.length} leads
      </div>
    </div>
  );
};
