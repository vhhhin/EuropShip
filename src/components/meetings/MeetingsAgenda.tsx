import React, { useState, useMemo, useCallback } from 'react';
import { useLeads } from '@/hooks/useLeads';
import { Lead, LeadStatus, SOURCE_COLORS } from '@/types/lead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MeetingModal from '@/components/leads/MeetingModal';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Video, Phone, Mail, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

// FIX BUG 1: Helper to format date as YYYY-MM-DD using LOCAL components (no timezone shift)
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// FIX BUG 1: Helper to normalize meeting date to YYYY-MM-DD
function normalizeMeetingDate(meetingDate: string | undefined): string | null {
  if (!meetingDate) return null;
  // If ISO format, extract just the date part
  if (meetingDate.includes('T')) {
    return meetingDate.split('T')[0];
  }
  return meetingDate;
}

export default function MeetingsAgenda() {
  // Get data directly from hook - this is the SINGLE SOURCE OF TRUTH
  const { getMeetingBookedLeads, setMeetingDetails, updateStatus, updateTrigger } = useLeads();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  // Get meeting leads - re-renders when updateTrigger changes
  const meetingLeads = useMemo(() => {
    return getMeetingBookedLeads();
  }, [getMeetingBookedLeads, updateTrigger]);

  // Calendar grid
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startingDay = firstDay.getDay();
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    const weeks: (Date | null)[][] = [];
    let week: (Date | null)[] = [];
    
    for (let i = 0; i < startingDay; i++) week.push(null);
    for (let day = 1; day <= totalDays; day++) {
      week.push(new Date(year, month, day));
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return weeks;
  }, [currentDate]);

  // FIX BUG 1: Get meetings for date using string comparison only
  const getMeetingsForDate = useCallback((date: Date): Lead[] => {
    // Format calendar date as YYYY-MM-DD using LOCAL date components
    const calendarDateStr = formatLocalDate(date);
    
    return meetingLeads.filter(lead => {
      const leadDateStr = normalizeMeetingDate(lead.meetingDate);
      if (!leadDateStr) return false;
      
      // Direct string comparison - no Date object conversion
      return leadDateStr === calendarDateStr;
    });
  }, [meetingLeads]);

  const handleDayClick = (date: Date) => {
    const meetings = getMeetingsForDate(date);
    if (meetings.length > 0) {
      setSelectedDate(date);
      setIsDayModalOpen(true);
    }
  };

  const handleMeetingClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDayModalOpen(false);
    setIsModalOpen(true);
  };

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedLead(null), 100);
  }, []);

  const closeDayModal = useCallback(() => {
    setIsDayModalOpen(false);
    setTimeout(() => setSelectedDate(null), 100);
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
    // Close modal after status change as the lead might no longer be "meeting booked"
    if (status !== 'meeting booked') {
      closeModal();
    }
  }, [updateStatus, closeModal]);

  const isToday = (date: Date) => formatLocalDate(date) === formatLocalDate(new Date());
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  // CRITICAL: Selected date meetings - recalculated when meetingLeads changes
  const selectedDateMeetings = useMemo(() => {
    return selectedDate ? getMeetingsForDate(selectedDate) : [];
  }, [selectedDate, getMeetingsForDate]);

  // FIX BUG 1: Upcoming meetings using string comparison
  const upcomingMeetings = useMemo(() => {
    const today = new Date();
    const todayStr = formatLocalDate(today);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = formatLocalDate(nextWeek);
    
    return meetingLeads
      .filter(lead => {
        const leadDateStr = normalizeMeetingDate(lead.meetingDate);
        if (!leadDateStr) return false;
        
        // String comparison for date range
        return leadDateStr >= todayStr && leadDateStr <= nextWeekStr;
      })
      .sort((a, b) => {
        const dateA = normalizeMeetingDate(a.meetingDate) || '';
        const dateB = normalizeMeetingDate(b.meetingDate) || '';
        return dateA.localeCompare(dateB);
      });
  }, [meetingLeads]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meetings Agenda</h1>
          <p className="text-muted-foreground">View and manage your scheduled meetings</p>
        </div>
        <Badge variant="outline" className="text-success border-success">
          {meetingLeads.length} Meetings
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                {monthName}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarData.flat().map((date, index) => {
                if (!date) return <div key={`empty-${index}`} className="h-24 bg-secondary/20 rounded-lg" />;
                
                const dayMeetings = getMeetingsForDate(date);
                const hasMeetings = dayMeetings.length > 0;
                const today = isToday(date);
                
                return (
                  <div
                    key={formatLocalDate(date)}
                    onClick={() => hasMeetings && handleDayClick(date)}
                    className={cn(
                      "h-24 p-2 rounded-lg border transition-all",
                      today ? "border-primary bg-primary/5" : "border-border",
                      hasMeetings && "cursor-pointer hover:bg-secondary/50 hover:border-success/50"
                    )}
                  >
                    <div className={cn("text-sm font-medium mb-1", today ? "text-primary" : "text-foreground")}>
                      {date.getDate()}
                    </div>
                    {hasMeetings && (
                      <div className="space-y-1">
                        {dayMeetings.slice(0, 2).map(meeting => {
                          const name = String(meeting['Name'] || meeting['Full Name'] || meeting['Email'] || 'Meeting');
                          return (
                            <div key={meeting.id} className="text-xs bg-success/20 text-success px-1.5 py-0.5 rounded truncate">
                              {meeting.meetingTime && <span className="font-medium">{meeting.meetingTime} </span>}
                              {name.split(' ')[0]}
                            </div>
                          );
                        })}
                        {dayMeetings.length > 2 && (
                          <div className="text-xs text-muted-foreground">+{dayMeetings.length - 2} more</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Meetings Sidebar */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              Upcoming (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {upcomingMeetings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No upcoming meetings</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingMeetings.map(meeting => {
                    const name = String(meeting['Name'] || meeting['Full Name'] || meeting['Email'] || `Lead ${meeting.id}`);
                    const dateStr = normalizeMeetingDate(meeting.meetingDate);
                    
                    return (
                      <div
                        key={meeting.id}
                        onClick={() => handleMeetingClick(meeting)}
                        className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors border border-border"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                            <Video className="w-4 h-4 text-success" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{name}</p>
                            <p className="text-xs text-muted-foreground">
                              {dateStr}
                              {meeting.meetingTime && ` at ${meeting.meetingTime}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Day Details Modal */}
      <Dialog open={isDayModalOpen} onOpenChange={(open) => !open && closeDayModal()}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {selectedDateMeetings.map(meeting => {
              const name = String(meeting['Name'] || meeting['Full Name'] || meeting['Email'] || `Lead ${meeting.id}`);
              const email = String(meeting['Email'] || '');
              const phone = String(meeting['Phone'] || '');
              const company = String(meeting['Company'] || '');
              const sourceColor = SOURCE_COLORS[meeting.source];

              return (
                <div
                  key={meeting.id}
                  onClick={() => handleMeetingClick(meeting)}
                  className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors border border-border"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center text-success font-semibold">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{name}</p>
                        {meeting.meetingTime && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {meeting.meetingTime}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={`${sourceColor?.bg} ${sourceColor?.text} border-0 text-xs`}>
                      {meeting.source.replace(' Request', '').replace(' Form', '')}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3 h-3" /><span className="truncate">{email}</span></div>}
                    {phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3 h-3" />{phone}</div>}
                    {company && <div className="flex items-center gap-2 text-muted-foreground col-span-2"><Building className="w-3 h-3" />{company}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Meeting Detail Modal */}
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
