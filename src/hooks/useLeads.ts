import { useQuery } from '@tanstack/react-query';
import { Lead, LeadSource, LeadStatus } from '@/types/lead';
import { fetchAllLeads } from '@/lib/googleSheets';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useState, useEffect } from 'react';
import { useNotificationTriggers } from '@/hooks/useNotificationTriggers';

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
  } catch {
    return {};
  }
}

// Save persisted data to localStorage
function savePersistedData(data: Record<string, PersistedLeadData>): void {
  localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(data));
}

export function useLeads() {
  const { user } = useAuth();
  const [persistedData, setPersistedData] = useState<Record<string, PersistedLeadData>>(loadPersistedData);

  // Get notification triggers
  let notificationTriggers: ReturnType<typeof useNotificationTriggers> | null = null;
  try {
    notificationTriggers = useNotificationTriggers();
  } catch {
    // NotificationProvider might not be available yet
  }

  // Auto-refresh every 30 seconds
  const { data: leadsBySource, isLoading, error, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: fetchAllLeads,
    refetchInterval: 30000, // 30 seconds
    staleTime: 15000, // 15 seconds
    refetchOnWindowFocus: true,
    retry: 3,
  });

  // Merge persisted data with fetched leads
  const mergeWithPersistedData = useCallback((leads: Lead[]): Lead[] => {
    return leads.map(lead => {
      const persisted = persistedData[lead.id];
      if (persisted) {
        return {
          ...lead,
          status: persisted.status || lead.status,
          notes: persisted.notes || lead.notes,
          assignedAgent: persisted.assignedAgent || lead.assignedAgent,
          meetingDate: persisted.meetingDate,
          meetingTime: persisted.meetingTime,
          meetingResult: persisted.meetingResult as Lead['meetingResult'],
          postMeetingNotes: persisted.postMeetingNotes,
        } as Lead;
      }
      return lead;
    });
  }, [persistedData]);

  // Get all leads (respecting role-based visibility)
  const getAllLeads = useCallback((): Lead[] => {
    if (!leadsBySource) return [];

    const allLeads = Object.values(leadsBySource).flat();
    const mergedLeads = mergeWithPersistedData(allLeads);

    // Admin sees all, Agent sees only assigned
    if (user?.role === 'ADMIN') {
      return mergedLeads;
    } else if (user?.role === 'AGENT') {
      return mergedLeads.filter(lead => 
        lead.assignedAgent === user.username || 
        lead.assignedAgent === user.displayName ||
        !lead.assignedAgent // Also show unassigned leads
      );
    }

    return [];
  }, [leadsBySource, user, mergeWithPersistedData]);

  // Get leads by source
  const getLeadsBySource = useCallback((source: LeadSource): Lead[] => {
    if (!leadsBySource) return [];
    return mergeWithPersistedData(leadsBySource[source] || []);
  }, [leadsBySource, mergeWithPersistedData]);

  // Get leads excluding "meeting booked" status (for main table)
  const getActiveLeads = useCallback((): Lead[] => {
    return getAllLeads().filter(lead => lead.status !== 'meeting booked');
  }, [getAllLeads]);

  // Get leads with "meeting booked" status
  const getMeetingBookedLeads = useCallback((): Lead[] => {
    return getAllLeads().filter(lead => lead.status === 'meeting booked');
  }, [getAllLeads]);

  // Update lead data
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
  }, []);

  // Add note to lead
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
  }, []);

  // Update lead status with notification
  const updateStatus = useCallback((leadId: string, status: LeadStatus) => {
    // Get the lead to check old status
    const allLeads = getAllLeads();
    const lead = allLeads.find(l => l.id === leadId);
    const oldStatus = lead?.status;

    updateLead(leadId, { status });

    // Trigger notification if status changed
    if (lead && oldStatus && oldStatus !== status && notificationTriggers) {
      notificationTriggers.notifyStatusChange(lead, oldStatus, status);
    }
  }, [updateLead, getAllLeads, notificationTriggers]);

  // Set meeting details
  const setMeetingDetails = useCallback((leadId: string, details: {
    meetingDate?: string;
    meetingTime?: string;
    meetingResult?: string;
    postMeetingNotes?: string;
  }) => {
    updateLead(leadId, details);
  }, [updateLead]);

  // Get statistics
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
      
      // More flexible source matching
      const leadSource = lead.source;
      if (leadSource) {
        // Direct match
        if (leadSource in sourceCounts) {
          sourceCounts[leadSource as LeadSource]++;
        } else {
          // Try to match by partial name (case-insensitive)
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
  };
}
