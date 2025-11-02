export interface Source {
  web?: {
    uri: string;
    title: string;
  };
}

export interface AttachedFile {
  name: string;
  type: string; // mimeType
  size: number;
  dataUrl: string; // for preview
  base64: string; // for API
}

export type ResearchScope = 'comprehensive' | 'pros-cons' | 'historical' | 'compare-contrast' | 'technical';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: Source[];
  isError?: boolean;
  feedback?: 'up' | 'down';
  imageUrl?: string;
  videoUrl?: string;
  originalText?: string;
  isThinking?: boolean;
  timestamp?: string;
  attachment?: AttachedFile;
  researchScope?: ResearchScope;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export type PredefinedDateFilter = 'any' | 'day' | 'week' | 'month' | 'year';

export interface CustomDateFilter {
  startDate: string | null;
  endDate: string | null;
}

export type DateFilter = PredefinedDateFilter | CustomDateFilter;

export type ModelId = 'gemini-2.5-flash' | 'gemini-2.5-pro';