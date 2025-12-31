import { useTimeTrackingContext } from '@/contexts/TimeTrackingContext';

export const useTimeTracking = () => {
  return useTimeTrackingContext();
};
