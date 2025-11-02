export interface Source {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: Source[];
  isError?: boolean;
  feedback?: 'up' | 'down';
  imageUrl?: string;
  videoUrl?: string;
}

export type PredefinedDateFilter = 'any' | 'day' | 'week' | 'month' | 'year';

export interface CustomDateFilter {
  startDate: string | null;
  endDate: string | null;
}

export type DateFilter = PredefinedDateFilter | CustomDateFilter;