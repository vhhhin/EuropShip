import { LeadSource as LeadSourceType } from '@/types/lead';

export interface LeadSourceConfig {
  id: string;
  label: string;
  fullName: LeadSourceType;
  color: string;
  bgColor: string;
}

export const LEAD_SOURCE_CONFIGS: LeadSourceConfig[] = [
  {
    id: 'email',
    label: 'Email',
    fullName: 'Email Request',
    color: '#f97316',
    bgColor: 'bg-orange-500',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    fullName: 'Instagram Request',
    color: '#e91e63',
    bgColor: 'bg-pink-500',
  },
  {
    id: 'ecomvestors',
    label: 'Ecomvestors',
    fullName: 'Ecomvestors Form',
    color: '#3b82f6',
    bgColor: 'bg-blue-500',
  },
  {
    id: 'euroship',
    label: 'EuroShip',
    fullName: 'EuroShip Form',
    color: '#10b981',
    bgColor: 'bg-emerald-500',
  },
];

export const getSourceConfigById = (id: string): LeadSourceConfig | undefined => {
  return LEAD_SOURCE_CONFIGS.find((source) => source.id === id);
};

export const getSourceConfigByFullName = (fullName: string): LeadSourceConfig | undefined => {
  return LEAD_SOURCE_CONFIGS.find(
    (source) => source.fullName.toLowerCase() === fullName.toLowerCase()
  );
};
