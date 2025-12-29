import { useMemo } from 'react';
import { LEAD_SOURCES } from '../config/leadSources';

export const useLeadCounts = (leads: any[]) => {
  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    
    LEAD_SOURCES.forEach((source) => {
      result[source.id] = leads.filter(
        (lead) => lead.source?.toLowerCase() === source.label.toLowerCase()
      ).length;
    });
    
    return result;
  }, [leads]);
  
  const totalCount = leads.length;
  
  return { counts, totalCount };
};
