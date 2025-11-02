import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, FilterIcon, XIcon } from './Icons';
import { DateFilter, PredefinedDateFilter } from '../types';
import FilterPanel from './FilterPanel';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  activeFilter: DateFilter;
  onFilterChange: (filter: DateFilter) => void;
  isFilterMenuOpen: boolean;
  onToggleFilterMenu: () => void;
  onCloseFilterMenu: () => void;
  placeholder?: string;
}

const filterOptions: { key: PredefinedDateFilter, label: string }[] = [
    { key: 'any', label: 'Any time' },
    { key: 'day', label: 'Past 24 hours' },
    { key: 'week', label: 'Past week' },
    { key: 'month', label: 'Past month' },
    { key: 'year', label: 'Past year' },
];

const formatFilterLabel = (filter: DateFilter): string => {
  if (typeof filter === 'string') {
    const option = filterOptions.find(opt => opt.key === filter);
    return option?.label || 'Any time';
  }
  const { startDate, endDate } = filter;
  if (startDate && endDate) return `${startDate} to ${endDate}`;
  if (startDate) return `From ${startDate}`;
  if (endDate) return `To ${endDate}`;
  return 'Custom range';
};

const ChatInput: React.FC<ChatInputProps> = ({ 
    onSendMessage, 
    isLoading, 
    activeFilter, 
    onFilterChange,
    isFilterMenuOpen,
    onToggleFilterMenu,
    onCloseFilterMenu,
    placeholder
}) => {
  const [text, setText] = useState('');
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height to recalculate
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim()) {
      onSendMessage(text);
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Effect to close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const filterButton = document.querySelector('[aria-label="Open search filters (F)"]');
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target as Node) &&
        !filterButton?.contains(event.target as Node)
      ) {
        onCloseFilterMenu();
      }
    };

    if (isFilterMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterMenuOpen, onCloseFilterMenu]);

  const isFilterActive = !(typeof activeFilter === 'string' && activeFilter === 'any');

  return (
    <div className="relative">
      {isFilterMenuOpen && (
        <div ref={filterMenuRef}>
            <FilterPanel 
                activeFilter={activeFilter}
                onApplyFilter={(newFilter) => {
                    onFilterChange(newFilter);
                    onCloseFilterMenu();
                }}
                onClose={onCloseFilterMenu}
            />
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {isFilterActive && (
          <div className="flex items-center space-x-2 text-xs bg-gray-800 border-x border-t border-gray-700 px-3 py-1.5 rounded-t-lg w-full">
            <FilterIcon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="text-gray-300 font-medium truncate" title={formatFilterLabel(activeFilter)}>
              {formatFilterLabel(activeFilter)}
            </span>
            <button 
              type="button" 
              onClick={() => onFilterChange('any')} 
              className="ml-auto text-gray-500 hover:text-white"
              aria-label="Clear filter"
              title="Clear filter"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className={`flex items-start space-x-2 sm:space-x-3 bg-gray-800 border border-gray-700 p-2 focus-within:ring-2 focus-within:ring-cyan-500 transition-shadow duration-200 ${
          isFilterActive ? 'rounded-b-lg' : 'rounded-lg'
        }`}>
            <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Ask me anything..."}
            className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none px-2 text-sm sm:text-base resize-none overflow-y-hidden"
            disabled={isLoading}
            style={{ maxHeight: '120px' }}
            />
            <div className="flex flex-col self-end h-full justify-end">
                <button
                type="button"
                onClick={onToggleFilterMenu}
                aria-expanded={isFilterMenuOpen}
                aria-controls="filter-menu"
                aria-label="Open search filters (F)"
                title="Open search filters (F)"
                className={`p-2 rounded-md hover:bg-gray-700/80 transition-colors duration-200 ${
                    isFilterActive ? 'text-cyan-400' : 'text-gray-400'
                }`}
                >
                <FilterIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="flex flex-col self-end h-full justify-end">
                <button
                type="submit"
                disabled={isLoading || !text.trim()}
                className="p-2 rounded-md bg-cyan-600 text-white hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                aria-label="Send message (Enter)"
                title="Send message (Enter)"
                >
                <SendIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;