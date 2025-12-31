import React, { useState, useCallback, useMemo } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/AuthContext';
import { Lead, LeadStatus, SOURCE_COLORS } from '@/types/lead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import MeetingModal from '@/components/leads/MeetingModal';
import { Calendar, Video, Clock, ChevronRight, Search, RefreshCw, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const EXCLUDED_COLUMNS = ['id', 'source', 'status', 'notes', 'assignedAgent', 'meetingDate', 'meetingTime', 'meetingResult', 'postMeetingNotes'];
const COLUMN_PRIORITY = ['Name', 'Full Name', 'Email', 'Phone', 'Company'];
type SortDirection = 'asc' | 'desc' | null;

export default function MeetingsListPage() {
  const { user } = useAuth();
  const { getMeetingBookedLeads, setMeetingDetails, updateStatus, isLoading, refetch, updateTrigger } = useLeads();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // CRITICAL: Get fresh meetings data - depends on updateTrigger
  const meetingLeads = useMemo(() => {
    return getMeetingBookedLeads();
  }, [getMeetingBookedLeads, updateTrigger]);

  const filteredLeads = useMemo(() => {
    if (!searchQuery) return meetingLeads;
    const query = searchQuery.toLowerCase();
    return meetingLeads.filter(lead => Object.values(lead).some(v => String(v).toLowerCase().includes(query)));
  }, [meetingLeads, searchQuery]);

  const dynamicColumns = useMemo(() => {
    if (filteredLeads.length === 0) return ['Name', 'Email', 'Phone'];
    const allKeys = new Set<string>();
    filteredLeads.forEach(lead => Object.keys(lead).forEach(key => { if (!EXCLUDED_COLUMNS.includes(key) && lead[key]) allKeys.add(key); }));
    return Array.from(allKeys).sort((a, b) => {
      const pA = COLUMN_PRIORITY.indexOf(a), pB = COLUMN_PRIORITY.indexOf(b);
      if (pA !== -1 && pB !== -1) return pA - pB;
      if (pA !== -1) return -1;
      if (pB !== -1) return 1;
      return a.localeCompare(b);
    }).slice(0, 4);
  }, [filteredLeads]);

  const sortedLeads = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredLeads;
    return [...filteredLeads].sort((a, b) => {
      const valA = a[sortColumn], valB = b[sortColumn];
      if (valA == null) return sortDirection === 'asc' ? 1 : -1;
      if (valB == null) return sortDirection === 'asc' ? -1 : 1;
      const cmp = String(valA).toLowerCase().localeCompare(String(valB).toLowerCase());
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filteredLeads, sortColumn, sortDirection]);

  const handleSort = (col: string) => {
    if (sortColumn === col) { if (sortDirection === 'asc') setSortDirection('desc'); else { setSortColumn(null); setSortDirection(null); } }
    else { setSortColumn(col); setSortDirection('asc'); }
  };
  const getSortIcon = (col: string) => sortColumn !== col ? <ArrowUpDown className="w-3 h-3 opacity-50" /> : sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  const handleLeadClick = (lead: Lead) => { setSelectedLead(lead); setIsModalOpen(true); };
  const closeModal = useCallback(() => { setIsModalOpen(false); setTimeout(() => setSelectedLead(null), 100); }, []);
  // CRITICAL: Use shared setMeetingDetails
  const handleSetMeetingDetails = useCallback((leadId: string, details: { meetingDate?: string; meetingTime?: string; meetingResult?: string; postMeetingNotes?: string }) => { setMeetingDetails(leadId, details); }, [setMeetingDetails]);
  // CRITICAL: Use shared updateStatus
  const handleUpdateStatus = useCallback((leadId: string, status: LeadStatus) => {
    updateStatus(leadId, status);
  }, [updateStatus]);
  const formatCell = (v: unknown) => v == null || v === '' ? '-' : String(v);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meetings List</h1>
          <p className="text-muted-foreground">Manage your scheduled meetings</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/20">
            <Calendar className="w-5 h-5 text-success" />
            <span className="font-semibold text-success">{meetingLeads.length} Meetings</span>
          </div>
          <Button onClick={() => refetch()} disabled={isLoading} variant="outline" size="sm">
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Meetings Table */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Video className="w-5 h-5 text-success" />
            Scheduled Meetings ({sortedLeads.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sortedLeads.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No meetings scheduled</p>
              <p className="text-sm text-muted-foreground mt-1">
                Set a lead's status to "Meeting Booked" to see it here
              </p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="min-w-max">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      {dynamicColumns.map(col => (
                        <th
                          key={col}
                          className="text-left px-4 py-3 text-muted-foreground font-medium text-sm cursor-pointer hover:bg-secondary/80"
                          onClick={() => handleSort(col)}
                        >
                          <div className="flex items-center gap-1">
                            <span className="truncate max-w-[150px]">{col}</span>
                            {getSortIcon(col)}
                          </div>
                        </th>
                      ))}
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium text-sm">Source</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium text-sm">Meeting Date</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium text-sm">Meeting Time</th>
                      {user?.role === 'ADMIN' && (
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium text-sm">Assigned</th>
                      )}
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLeads.map(lead => {
                      const srcColor = SOURCE_COLORS[lead.source];
                      return (
                        <tr
                          key={lead.id}
                          onClick={() => handleLeadClick(lead)}
                          className="border-b border-border hover:bg-secondary/50 cursor-pointer transition-colors group"
                        >
                          {dynamicColumns.map(col => (
                            <td key={col} className="px-4 py-3 text-foreground text-sm">
                              <span className="truncate block max-w-[200px]">{formatCell(lead[col])}</span>
                            </td>
                          ))}
                          <td className="px-4 py-3">
                            <Badge className={`${srcColor?.bg} ${srcColor?.text} border-0 text-xs`}>
                              {lead.source.replace(' Request', '').replace(' Form', '')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-foreground text-sm">
                            {lead.meetingDate ? (
                              <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                {lead.meetingDate}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Not scheduled</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-foreground text-sm">
                            {lead.meetingTime ? (
                              <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                {lead.meetingTime}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          {user?.role === 'ADMIN' && (
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {lead.assignedAgent || '-'}
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-success transition-colors" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Meeting Modal */}
      <MeetingModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={closeModal}
        onSetMeetingDetails={handleSetMeetingDetails}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
