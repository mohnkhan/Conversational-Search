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
}

export type DateFilter = 'any' | 'day' | 'week' | 'month' | 'year';
