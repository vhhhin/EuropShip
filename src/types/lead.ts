// Lead status enum - STRICT, no other values allowed
export type LeadStatus = 
  | 'new'
  | 'called'
  | 'missed'
  | 'follow up'
  | 'not interested'
  | 'qualified'
  | 'not qualified'
  | 'meeting booked'
  | 'closed';

export const LEAD_STATUSES: LeadStatus[] = [
  'new',
  'called',
  'missed',
  'follow up',
  'not interested',
  'qualified',
  'not qualified',
  'meeting booked',
  'closed'
];

// Meeting result options
export type MeetingResult = 'missed' | 'not interested' | 'follow up' | 'closed';

export const MEETING_RESULTS: MeetingResult[] = ['missed', 'not interested', 'follow up', 'closed'];

// Lead sources - each tab in the Google Sheet
export type LeadSource = 
  | 'Email Request'
  | 'Instagram Request'
  | 'Ecomvestors Form'
  | 'EuroShip Form';  // On garde ce nom dans le code pour l'affichage

export const LEAD_SOURCES: LeadSource[] = [
  'Email Request',
  'Instagram Request',
  'Ecomvestors Form',
  'EuroShip Form'
];

// Lead interface - dynamically adapts to sheet columns
export interface Lead {
  id: string;
  source: LeadSource;
  status: LeadStatus;
  assignedAgent?: string;
  notes: string[];
  meetingDate?: string;
  meetingTime?: string;
  meetingResult?: MeetingResult;
  postMeetingNotes?: string;
  hasMeeting?: boolean; // Flag indiquant que le lead appartient au tableau Meetings (indépendant du statut)
  // Dynamic fields from sheet - any column can be added
  [key: string]: unknown;
}

// Note interface
export interface LeadNote {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  authorName: string;
}

// Status color mapping
export const STATUS_COLORS: Record<LeadStatus, { bg: string; text: string; border: string }> = {
  'new': { bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/30' },
  'called': { bg: 'bg-accent/20', text: 'text-accent', border: 'border-accent/30' },
  'missed': { bg: 'bg-warning/20', text: 'text-warning', border: 'border-warning/30' },
  'follow up': { bg: 'bg-accent/20', text: 'text-accent', border: 'border-accent/30' },
  'not interested': { bg: 'bg-destructive/20', text: 'text-destructive', border: 'border-destructive/30' },
  'qualified': { bg: 'bg-success/20', text: 'text-success', border: 'border-success/30' },
  'not qualified': { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' },
  'meeting booked': { bg: 'bg-success/20', text: 'text-success', border: 'border-success/30' },
  'closed': { bg: 'bg-emerald-500/20', text: 'text-emerald-500', border: 'border-emerald-500/30' }
};

// Source color mapping
export const SOURCE_COLORS: Record<LeadSource, { bg: string; text: string }> = {
  'Email Request': { bg: 'bg-primary/20', text: 'text-primary' },
  'Instagram Request': { bg: 'bg-accent/20', text: 'text-accent' },
  'Ecomvestors Form': { bg: 'bg-success/20', text: 'text-success' },
  'EuroShip Form': { bg: 'bg-warning/20', text: 'text-warning' }
};
