import React, { useState, useCallback } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { Lead, LeadStatus, SOURCE_COLORS } from '@/types/lead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import MeetingModal from '@/components/leads/MeetingModal';
import { Calendar, Video, Clock, ChevronRight } from 'lucide-react';

export default function MeetingsPage() {
  const { getMeetingBookedLeads, setMeetingDetails, updateStatus } = useLeads();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const meetingLeads = getMeetingBookedLeads();

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedLead(null), 100);
  }, []);

  const handleSetMeetingDetails = useCallback((leadId: string, details: {
    meetingDate?: string;
    meetingTime?: string;
    meetingResult?: string;
    postMeetingNotes?: string;
  }) => {
    setMeetingDetails(leadId, details);
  }, [setMeetingDetails]);

  const handleUpdateStatus = useCallback((leadId: string, status: LeadStatus) => {
    updateStatus(leadId, status);
  }, [updateStatus]);

  // Get display columns
  const getDisplayColumns = (): string[] => {
    if (meetingLeads.length === 0) return ['Name', 'Email', 'Company'];
    
    const firstLead = meetingLeads[0];
    const excludeKeys = ['id', 'source', 'status', 'notes', 'assignedAgent', 'meetingDate', 'meetingTime', 'meetingResult', 'postMeetingNotes'];
    
    return Object.keys(firstLead)
      .filter(key => !excludeKeys.includes(key) && firstLead[key] !== null && firstLead[key] !== undefined)
      .slice(0, 4);
  };

  const displayColumns = getDisplayColumns();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meetings Booked</h1>
          <p className="text-muted-foreground">
            Manage scheduled meetings and record outcomes
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/20">
          <Calendar className="w-5 h-5 text-success" />
          <span className="font-semibold text-success">{meetingLeads.length} Meetings</span>
        </div>
      </div>

      {/* Meetings Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Video className="w-5 h-5 text-success" />
            Scheduled Meetings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {meetingLeads.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No meetings scheduled</p>
              <p className="text-sm text-muted-foreground mt-1">
                Leads with "Meeting Booked" status will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    {displayColumns.map(col => (
                      <TableHead key={col} className="text-muted-foreground">{col}</TableHead>
                    ))}
                    <TableHead className="text-muted-foreground">Source</TableHead>
                    <TableHead className="text-muted-foreground">Meeting Date</TableHead>
                    <TableHead className="text-muted-foreground">Meeting Time</TableHead>
                    <TableHead className="text-muted-foreground w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetingLeads.map((lead) => {
                    const sourceColor = SOURCE_COLORS[lead.source];
                    
                    return (
                      <TableRow 
                        key={lead.id}
                        onClick={() => handleLeadClick(lead)}
                        className="border-border hover:bg-secondary/50 cursor-pointer transition-colors group"
                      >
                        {displayColumns.map(col => (
                          <TableCell key={col} className="text-foreground">
                            {String(lead[col] || '-')}
                          </TableCell>
                        ))}
                        <TableCell>
                          <Badge className={`${sourceColor?.bg} ${sourceColor?.text} border-0`}>
                            {lead.source.replace(' Request', '').replace(' Form', '')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {lead.meetingDate ? (
                            <span className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {lead.meetingDate}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Not scheduled</span>
                          )}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {lead.meetingTime ? (
                            <span className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              {lead.meetingTime}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-success transition-colors" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
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
