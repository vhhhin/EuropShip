import { useQuery } from '@tanstack/react-query';
import { Lead, LeadSource, LeadStatus } from '@/types/lead';
import { fetchAllLeads } from '@/lib/googleSheets';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useState, useMemo, useEffect } from 'react';

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

// --- LocalStorage helpers ---
function loadPersistedData(): Record<string, PersistedLeadData> {
  try {
    const data = localStorage.getItem(LEADS_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.warn('[useLeads] Failed to load persisted data:', e);
    return {};
  }
}

function savePersistedData(data: Record<string, PersistedLeadData>): void {
  try {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('[useLeads] Failed to save persisted data:', e);
  }
}

// --- Listeners for real-time subscription ---
type LeadsListener = (leads: Lead[]) => void;
const leadsListeners: Set<LeadsListener> = new Set();

function notifyLeadsListeners(leads: Lead[]) {
  leadsListeners.forEach(listener => {
    try { listener(leads); } catch {}
  });
}

// --- useLeads Hook ---
export function useLeads() {
  const { user } = useAuth();
  const [persistedData, setPersistedData] = useState<Record<string, PersistedLeadData>>(loadPersistedData);
  const [updateCounter, setUpdateCounter] = useState(0);

  // Fetch all leads via React Query
  const { data: leadsBySource, isLoading, error, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: fetchAllLeads,
    refetchInterval: 30000,
    staleTime: 15000,
    refetchOnWindowFocus: true,
    retry: 3,
  });

  // --- Merge leads with persisted data ---
  const mergedLeads = useMemo((): Lead[] => {
    if (!leadsBySource) return [];
    const allLeads = Object.values(leadsBySource).flat();

    const merged = allLeads.map(lead => {
      const persisted = persistedData[lead.id];
      if (!persisted) return lead;
      return {
        ...lead,
        status: persisted.status || lead.status,
        notes: persisted.notes || lead.notes,
        assignedAgent: persisted.assignedAgent || lead.assignedAgent,
        meetingDate: persisted.meetingDate ?? lead.meetingDate,
        meetingTime: persisted.meetingTime ?? lead.meetingTime,
        meetingResult: persisted.meetingResult ?? lead.meetingResult,
        postMeetingNotes: persisted.postMeetingNotes ?? lead.postMeetingNotes,
      } as Lead;
    });

    // Notifier tous les listeners à chaque changement
    notifyLeadsListeners(merged);

    return merged;
  }, [leadsBySource, persistedData, updateCounter]);

  // --- Subscription API ---
  const subscribeToLeads = useCallback((listener: LeadsListener) => {
    leadsListeners.add(listener);
    // Appel immédiat avec la valeur courante
    listener(mergedLeads);
    return () => {
      leadsListeners.delete(listener);
    };
  }, [mergedLeads]);

  // --- Role-based access ---
  const getAllLeads = useCallback((): Lead[] => {
    if (user?.role === 'ADMIN') return mergedLeads;
    if (user?.role === 'AGENT') {
      return mergedLeads.filter(
        lead =>
          !lead.assignedAgent ||
          [user.username, user.displayName, user.email].includes(lead.assignedAgent)
      );
    }
    return [];
  }, [mergedLeads, user]);

  const getLeadsBySource = useCallback(
    (source: LeadSource): Lead[] => mergedLeads.filter(l => l.source === source),
    [mergedLeads]
  );

  const getActiveLeads = useCallback(() => getAllLeads().filter(l => l.status !== 'meeting booked'), [getAllLeads]);

  const getMeetingBookedLeads = useCallback(() => {
    const allMeetings = mergedLeads.filter(l => l.status === 'meeting booked');
    if (user?.role === 'AGENT') {
      return allMeetings.filter(l =>
        [user.username, user.displayName, user.email].includes(l.assignedAgent ?? '')
      );
    }
    return allMeetings;
  }, [mergedLeads, user]);

  // --- Update helpers ---
  const updateLead = useCallback((leadId: string, updates: Partial<PersistedLeadData>) => {
    setPersistedData(prev => {
      const newData = { ...prev, [leadId]: { ...prev[leadId], ...updates } };
      savePersistedData(newData);
      return newData;
    });
    setUpdateCounter(c => c + 1);
  }, []);

  const addNote = useCallback((leadId: string, note: string) => {
    setPersistedData(prev => {
      const existingNotes = prev[leadId]?.notes || [];
      const newData = { ...prev, [leadId]: { ...prev[leadId], notes: [...existingNotes, note] } };
      savePersistedData(newData);
      return newData;
    });
    setUpdateCounter(c => c + 1);
  }, []);

  const updateStatus = useCallback(
    (leadId: string, status: LeadStatus) => {
      const lead = mergedLeads.find(l => l.id === leadId);
      const assignedAgent =
        lead?.assignedAgent ||
        (status === 'meeting booked' && user?.role === 'AGENT'
          ? user.email || user.username || user.displayName
          : undefined);

      setPersistedData(prev => {
        const newData = {
          ...prev,
          [leadId]: {
            ...prev[leadId],
            status,
            assignedAgent: status === 'meeting booked' && user?.role === 'AGENT' ? assignedAgent : prev[leadId]?.assignedAgent,
          },
        };
        savePersistedData(newData);
        return newData;
      });
      setUpdateCounter(c => c + 1);
    },
    [mergedLeads, user]
  );

  const setMeetingDetails = useCallback(
    (leadId: string, details: { meetingDate?: string; meetingTime?: string; meetingResult?: string; postMeetingNotes?: string }) => {
      const sanitizedDetails = { ...details };
      if (details.meetingDate?.includes('T')) sanitizedDetails.meetingDate = details.meetingDate.split('T')[0];

      setPersistedData(prev => {
        const newData = { ...prev, [leadId]: { ...prev[leadId], ...sanitizedDetails } };
        savePersistedData(newData);
        return newData;
      });
      setUpdateCounter(c => c + 1);
    },
    []
  );

  // --- Statistics ---
  const getStats = useCallback(() => {
    const leads = getAllLeads();
    const statusCounts: Record<LeadStatus, number> = {
      new: 0,
      called: 0,
      missed: 0,
      'follow up': 0,
      'not interested': 0,
      qualified: 0,
      'not qualified': 0,
      'meeting booked': 0,
      closed: 0,
    };
    const sourceCounts: Record<LeadSource, number> = {
      'Email Request': 0,
      'Instagram Request': 0,
      'Ecomvestors Form': 0,
      'EuroShip Form': 0,
    };
    leads.forEach(lead => {
      if (lead.status in statusCounts) statusCounts[lead.status]++;
      const src = String(lead.source).toLowerCase();
      if (src.includes('email')) sourceCounts['Email Request']++;
      else if (src.includes('instagram')) sourceCounts['Instagram Request']++;
      else if (src.includes('ecomvestor')) sourceCounts['Ecomvestors Form']++;
      else if (src.includes('euroship')) sourceCounts['EuroShip Form']++;
    });
    return { total: leads.length, byStatus: statusCounts, bySource: sourceCounts };
  }, [getAllLeads]);

  // --- Daily leads per source ---
  const getTodayNewLeadsBySource = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const counts: Record<LeadSource, number> = {
      'Email Request': 0,
      'Instagram Request': 0,
      'Ecomvestors Form': 0,
      'EuroShip Form': 0,
    };

    mergedLeads.forEach(lead => {
      let leadDate: string | null = null;
      const dateFields = ['Date', 'date', 'Created Date', 'created date', 'Timestamp', 'Created', 'created_at', 'createdAt'];
      for (const field of dateFields) {
        if (lead[field]) {
          const parsed = new Date(String(lead[field]));
          if (!isNaN(parsed.getTime())) {
            leadDate = parsed.toISOString().split('T')[0];
            break;
          }
        }
      }

      const src = String(lead.source || '').toLowerCase();
      let canonicalSource: LeadSource | null = null;
      if (src.includes('email')) canonicalSource = 'Email Request';
      else if (src.includes('instagram')) canonicalSource = 'Instagram Request';
      else if (src.includes('ecomvestor')) canonicalSource = 'Ecomvestors Form';
      else if (src.includes('euroship')) canonicalSource = 'EuroShip Form';

      if (leadDate === today && canonicalSource) counts[canonicalSource]++;
    });

    return counts;
  }, [mergedLeads]);

  // --- Force refetch for agents ---
  useEffect(() => {
    if (user?.role === 'AGENT' && refetch) refetch({ cancelRefetch: false });
  }, [user?.role, refetch]);

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
    getTodayNewLeadsBySource,
    subscribeToLeads,
  };
}
