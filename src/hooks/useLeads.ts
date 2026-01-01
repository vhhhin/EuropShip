import { useQuery } from '@tanstack/react-query';
import { Lead, LeadSource, LeadStatus } from '@/types/lead';
import { fetchAllLeads } from '@/lib/googleSheets';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useState, useMemo, useEffect } from 'react';

// Local storage key for persisted lead data (status, notes, meetings)
const LEADS_STORAGE_KEY = 'euroship_leads_data';

interface PersistedLeadData {
  status?: LeadStatus;
  notes?: string[];
  assignedAgent?: string;
  meetingDate?: string;
  meetingTime?: string;
  meetingResult?: string;
  postMeetingNotes?: string;
}

// Load persisted data from localStorage
function loadPersistedData(): Record<string, PersistedLeadData> {
  try {
    const data = localStorage.getItem(LEADS_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.warn('[useLeads] Failed to load persisted data:', e);
    return {};
  }
}

// Save persisted data to localStorage
function savePersistedData(data: Record<string, PersistedLeadData>): void {
  try {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[useLeads] Failed to save persisted data:', e);
  }
}

export function useLeads() {
  const { user } = useAuth();
  
  const [persistedData, setPersistedData] = useState<Record<string, PersistedLeadData>>(loadPersistedData);
  const [updateCounter, setUpdateCounter] = useState(0);

  const { data: leadsBySource, isLoading, error, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: fetchAllLeads,
    refetchInterval: 30000,
    staleTime: 15000,
    refetchOnWindowFocus: true,
    retry: 3,
  });

  // CRITICAL: Compute merged leads using useMemo with proper dependencies
  // This ensures a NEW array reference when persistedData or leadsBySource changes
  const mergedLeads = useMemo((): Lead[] => {
    if (!leadsBySource) return [];
    
    const allLeads = Object.values(leadsBySource).flat();
    
    // Create NEW lead objects by merging with persisted data
    return allLeads.map(lead => {
      const persisted = persistedData[lead.id];
      if (persisted) {
        // Return a NEW object with merged data
        return {
          ...lead,
          status: persisted.status || lead.status,
          notes: persisted.notes || lead.notes,
          assignedAgent: persisted.assignedAgent || lead.assignedAgent,
          meetingDate: persisted.meetingDate ?? lead.meetingDate,
          meetingTime: persisted.meetingTime ?? lead.meetingTime,
          meetingResult: persisted.meetingResult as Lead['meetingResult'],
          postMeetingNotes: persisted.postMeetingNotes,
        } as Lead;
      }
      return lead;
    });
  }, [leadsBySource, persistedData, updateCounter]);

  // Get all leads (respecting role-based visibility)
  const getAllLeads = useCallback((): Lead[] => {
    if (user?.role === 'ADMIN') {
      return mergedLeads;
    } else if (user?.role === 'AGENT') {
      return mergedLeads.filter(lead => 
        lead.assignedAgent === user.username || 
        lead.assignedAgent === user.displayName ||
        lead.assignedAgent === user.email ||
        !lead.assignedAgent
      );
    }
    return [];
  }, [mergedLeads, user]);

  // Get leads by source
  const getLeadsBySource = useCallback((source: LeadSource): Lead[] => {
    return mergedLeads.filter(lead => lead.source === source);
  }, [mergedLeads]);

  // Get leads excluding "meeting booked" status (for main table)
  const getActiveLeads = useCallback((): Lead[] => {
    return getAllLeads().filter(lead => lead.status !== 'meeting booked');
  }, [getAllLeads]);

  // CRITICAL: Get meeting booked leads - derives directly from mergedLeads
  const getMeetingBookedLeads = useCallback((): Lead[] => {
    // Filter for meeting booked status from the SAME merged leads source
    const allMeetings = mergedLeads.filter(lead => lead.status === 'meeting booked');
    
    // Agent sees only their own meetings
    if (user?.role === 'AGENT') {
      return allMeetings.filter(lead => {
        const assigned = lead.assignedAgent?.toLowerCase();
        return assigned === user.email?.toLowerCase() ||
               assigned === user.username?.toLowerCase() ||
               assigned === user.displayName?.toLowerCase();
      });
    }
    
    // Admin sees all meetings
    return allMeetings;
  }, [mergedLeads, user]);

  const updateLead = useCallback((leadId: string, updates: Partial<PersistedLeadData>) => {
    setPersistedData(prev => {
      const newData = {
        ...prev,
        [leadId]: {
          ...prev[leadId],
          ...updates,
        }
      };
      savePersistedData(newData);
      return newData;
    });
    setUpdateCounter(c => c + 1);
  }, []);

  const addNote = useCallback((leadId: string, note: string) => {
    setPersistedData(prev => {
      const existingNotes = prev[leadId]?.notes || [];
      const newData = {
        ...prev,
        [leadId]: {
          ...prev[leadId],
          notes: [...existingNotes, note],
        }
      };
      savePersistedData(newData);
      return newData;
    });
    setUpdateCounter(c => c + 1);
  }, []);

  // CRITICAL FIX: Status update creates new state reference
  // Auto-assign agent when they set status to "meeting booked"
  const updateStatus = useCallback((leadId: string, status: LeadStatus) => {
    const lead = mergedLeads.find(l => l.id === leadId);
    const previousStatus = lead?.status;
    const assignedAgent = lead?.assignedAgent || 
      (status === 'meeting booked' && user?.role === 'AGENT'
        ? user.email || user.username || user.displayName
        : undefined);

    setPersistedData(prev => {
      const newData: Record<string, PersistedLeadData> = {
        ...prev,
        [leadId]: {
          ...prev[leadId],
          status,
          // Auto-assign agent when they book a meeting
          assignedAgent:
            status === 'meeting booked' && user?.role === 'AGENT'
              ? user.email || user.username || user.displayName
              : prev[leadId]?.assignedAgent,
        }
      };
      savePersistedData(newData);
      return newData;
    });
    setUpdateCounter(c => c + 1);

    // Notify agent if status changed to "follow up"
    if (status === 'follow up' && previousStatus !== 'follow up' && assignedAgent) {
      try {
        const { useNotifications } = require('@/contexts/NotificationContext');
        const notifications = useNotifications();
        if (notifications?.addNotification) {
          notifications.addNotification('follow_up_required', 'A lead requires follow-up', {
            leadId,
            agentId: assignedAgent,
          });
        }
      } catch {
        // Notification context not available
      }
    }
  }, [user, mergedLeads]);

  // Meeting details update
  const setMeetingDetails = useCallback((leadId: string, details: {
    meetingDate?: string;
    meetingTime?: string;
    meetingResult?: string;
    postMeetingNotes?: string;
  }) => {
    const sanitizedDetails = { ...details };
    
    if (details.meetingDate) {
      let dateStr = details.meetingDate;
      if (dateStr.includes('T')) {
        dateStr = dateStr.split('T')[0];
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        sanitizedDetails.meetingDate = dateStr;
      }
    }
    
    // Get lead and agent info for notification
    const lead = mergedLeads.find(l => l.id === leadId);
    const assignedAgent = lead?.assignedAgent;
    
    setPersistedData(prev => {
      const newData = {
        ...prev,
        [leadId]: {
          ...prev[leadId],
          ...sanitizedDetails,
        }
      };
      savePersistedData(newData);
      return newData;
    });
    setUpdateCounter(c => c + 1);

    // Notify agent if meeting is scheduled/updated
    if (assignedAgent && (details.meetingDate || details.meetingTime)) {
      try {
        const { useNotifications } = require('@/contexts/NotificationContext');
        const notifications = useNotifications();
        if (notifications?.addNotification) {
          notifications.addNotification('meeting_booked', 'A meeting has been scheduled or updated for one of your leads', {
            leadId,
            agentId: assignedAgent,
          });
        }
      } catch {
        // Notification context not available
      }
    }
  }, [mergedLeads]);

  const getStats = useCallback(() => {
    const leads = getAllLeads();
    const statusCounts: Record<LeadStatus, number> = {
      'new': 0,
      'called': 0,
      'missed': 0,
      'follow up': 0,
      'not interested': 0,
      'qualified': 0,
      'not qualified': 0,
      'meeting booked': 0,
      'closed': 0,
    };

    const sourceCounts: Record<LeadSource, number> = {
      'Email Request': 0,
      'Instagram Request': 0,
      'Ecomvestors Form': 0,
      'EuroShip Form': 0,
    };

    leads.forEach(lead => {
      if (lead.status in statusCounts) {
        statusCounts[lead.status]++;
      }
      
      const leadSource = lead.source;
      if (leadSource) {
        if (leadSource in sourceCounts) {
          sourceCounts[leadSource as LeadSource]++;
        } else {
          const sourceLower = leadSource.toLowerCase();
          if (sourceLower.includes('email')) {
            sourceCounts['Email Request']++;
          } else if (sourceLower.includes('instagram')) {
            sourceCounts['Instagram Request']++;
          } else if (sourceLower.includes('ecomvestor')) {
            sourceCounts['Ecomvestors Form']++;
          } else if (sourceLower.includes('euroship')) {
            sourceCounts['EuroShip Form']++;
          }
        }
      }
    });

    return {
      total: leads.length,
      byStatus: statusCounts,
      bySource: sourceCounts,
    };
  }, [getAllLeads]);

  // Agent-specific statistics with daily breakdown - ALREADY CORRECTLY IMPLEMENTED
  const getAgentStats = useCallback(() => {
    const leads = getAllLeads(); // Single source of truth
    
    // Only return agent stats if user is an agent
    if (user?.role !== 'AGENT') {
      return {
        totalLeads: 0,
        dailyBySource: {},
        totalBySource: {},
      };
    }

    // Calculate daily breakdown by source
    const dailyBySource: Record<string, Record<string, number>> = {};
    const totalBySource: Record<LeadSource, number> = {
      'Email Request': 0,
      'Instagram Request': 0,
      'Ecomvestors Form': 0,
      'EuroShip Form': 0,
    };

    leads.forEach(lead => {
      // Count total by source
      if (lead.source in totalBySource) {
        totalBySource[lead.source as LeadSource]++;
      }

      // Extract date from lead (if available) or use today
      // Try to get a date field from the lead
      let leadDate = new Date().toISOString().split('T')[0]; // Default to today
      
      // Check for common date fields
      if (lead['Date'] || lead['Created Date'] || lead['Timestamp']) {
        const dateField = lead['Date'] || lead['Created Date'] || lead['Timestamp'];
        try {
          const parsedDate = new Date(String(dateField));
          if (!isNaN(parsedDate.getTime())) {
            leadDate = parsedDate.toISOString().split('T')[0];
          }
        } catch {
          // Keep default date
        }
      }

      // Initialize nested object if needed
      if (!dailyBySource[leadDate]) {
        dailyBySource[leadDate] = {};
      }

      // Count by date and source
      const source = lead.source;
      dailyBySource[leadDate][source] = (dailyBySource[leadDate][source] || 0) + 1;
    });

    return {
      totalLeads: leads.length,
      dailyBySource, // { "2024-01-15": { "Email Request": 3, "Instagram Request": 5 } }
      totalBySource,
    };
  }, [getAllLeads, user]);

  // Get daily new leads by source for a specific date (Agent only)
  const getDailyNewLeadsBySource = useCallback((dateStr: string) => {
    if (user?.role !== 'AGENT') {
      return {
        'Email Request': 0,
        'Instagram Request': 0,
        'Ecomvestors Form': 0,
        'EuroShip Form': 0,
      };
    }

    const leads = getAllLeads();
    const counts: Record<LeadSource, number> = {
      'Email Request': 0,
      'Instagram Request': 0,
      'Ecomvestors Form': 0,
      'EuroShip Form': 0,
    };

    leads.forEach(lead => {
      // --- Normalize source ---
      let normalizedSource = '';
      if (typeof lead.source === 'string') {
        normalizedSource = lead.source.trim().toLowerCase();
      }

      // --- Find and normalize date field ---
      let leadDate: string | null = null;
      const possibleDateFields = [
        'Date', 'date', 'DATE',
        'Created Date', 'created date', 'CreatedDate', 'createdDate',
        'Timestamp', 'timestamp', 'TIMESTAMP',
        'Created', 'created', 'CREATED',
        'created_at', 'createdAt', 'Created_At',
        'date_added', 'dateAdded', 'DateAdded',
        'submission_date', 'submissionDate', 'SubmissionDate'
      ];
      let dateValue: unknown = null;
      for (const field of possibleDateFields) {
        if (lead[field]) {
          dateValue = lead[field];
          break;
        }
      }
      if (dateValue) {
        try {
          // Accept both "YYYY-MM-DD" and "DD/MM/YYYY" and "MM/DD/YYYY"
          let parsed: Date | null = null;
          if (typeof dateValue === 'string') {
            // Try ISO first
            parsed = new Date(dateValue);
            if (isNaN(parsed.getTime())) {
              // Try DD/MM/YYYY or MM/DD/YYYY
              const parts = dateValue.split(/[\/\-]/);
              if (parts.length === 3) {
                // Try DD/MM/YYYY
                const [a, b, c] = parts.map(Number);
                if (a > 31) {
                  // Probably YYYY-MM-DD
                  parsed = new Date(dateValue);
                } else if (c > 1900) {
                  // Assume c is year
                  parsed = new Date(`${c}-${b.toString().padStart(2, '0')}-${a.toString().padStart(2, '0')}`);
                }
              }
            }
          } else {
            parsed = new Date(String(dateValue));
          }
          if (parsed && !isNaN(parsed.getTime())) {
            leadDate = parsed.toISOString().split('T')[0];
          }
        } catch {}
      }

      // --- Map normalized source to canonical LeadSource ---
      let canonicalSource: LeadSource | null = null;
      if (normalizedSource.includes('email')) canonicalSource = 'Email Request';
      else if (normalizedSource.includes('instagram')) canonicalSource = 'Instagram Request';
      else if (normalizedSource.includes('ecomvestor')) canonicalSource = 'Ecomvestors Form';
      else if (normalizedSource.includes('euroship')) canonicalSource = 'EuroShip Form';

      // --- Count if date matches and source is valid ---
      if (leadDate === dateStr && canonicalSource) {
        counts[canonicalSource]++;
      }
    });

    // Log for debug
    console.log('[getDailyNewLeadsBySource][Agent] date:', dateStr, 'counts:', counts);

    return counts;
  }, [getAllLeads, user]);

  // Force refetch on mount for Agent (no cache)
  useEffect(() => {
    if (user?.role === 'AGENT' && typeof refetch === 'function') {
      refetch({ cancelRefetch: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  // Log raw Google Sheet rows for Agent
  useEffect(() => {
    if (user?.role === 'AGENT' && leadsBySource) {
      Object.entries(leadsBySource).forEach(([source, leads]) => {
        if (leads.length > 0) {
          // Log all raw rows for this source
          console.log(`[Agent][RAW SHEET ROWS][${source}]`, leads.map(l => ({ ...l })));
        }
      });
    }
  }, [user?.role, leadsBySource]);

  return {
    leadsBySource,
    isLoading,
    error,
    refetch,
    getAllLeads,
    getLeadsBySource,
    getActiveLeads,
    getMeetingBookedLeads,
    updateLead,
    addNote,
    updateStatus,
    setMeetingDetails,
    getStats,
    updateTrigger: updateCounter,
    getAgentStats,
    getDailyNewLeadsBySource,
  };
}
