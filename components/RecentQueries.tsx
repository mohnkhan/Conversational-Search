import React from 'react';
import { HistoryIcon, TrashIcon } from './Icons';

interface RecentQueriesProps {
  queries: string[];
  onQueryClick: (query: string) => void;
  onClear: () => void;
}

const RecentQueries: React.FC<RecentQueriesProps> = ({ queries, onQueryClick, onClear }) => {
  if (queries.length === 0) {
    return null;
  }

  return (
    <div className="pl-12 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[var(--text-muted)] flex items-center space-x-2">
          <HistoryIcon className="w-4 h-4" />
          <span>Recent Searches</span>
        </h2>
        <button
          onClick={onClear}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-danger)] flex items-center space-x-1 transition-colors"
          title="Clear recent searches"
        >
          <TrashIcon className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {queries.map((query, index) => (
          <button
            key={index}
            onClick={() => onQueryClick(query)}
            className="text-xs sm:text-sm bg-[var(--bg-secondary)]/60 backdrop-blur-sm hover:bg-[var(--bg-tertiary)]/60 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all duration-200"
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentQueries;
