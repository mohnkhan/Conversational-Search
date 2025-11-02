import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, FilterIcon } from './Icons';
import { DateFilter } from '../types';

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

const filterOptions: { key: DateFilter, label: string }[] = [
    { key: 'any', label: 'Any time' },
    { key: 'day', label: 'Past 24 hours' },
    { key: 'week', label: 'Past week' },
    { key: 'month', label: 'Past month' },
    { key: 'year', label: 'Past year' },
];

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

  const handleFilterSelect = (filter: DateFilter) => {
    onFilterChange(filter);
    onCloseFilterMenu();
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

  return (
    <div className="relative">
      {isFilterMenuOpen && (
        <div 
          ref={filterMenuRef}
          className="absolute bottom-full mb-2 w-full sm:w-auto left-0 sm:left-auto sm:right-16 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-2 z-10 animate-fade-in"
          style={{ animationDuration: '0.2s' }}
        >
          <p className="text-xs font-semibold text-gray-400 px-2 pb-1.5 pt-1">Filter by date</p>
          <div className="flex flex-col space-y-1">
            {filterOptions.map(option => (
              <button
                key={option.key}
                onClick={() => handleFilterSelect(option.key)}
                className={`w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${
                  activeFilter === option.key 
                    ? 'bg-cyan-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-start space-x-2 sm:space-x-3 bg-gray-800 border border-gray-700 rounded-lg p-2 focus-within:ring-2 focus-within:ring-cyan-500 transition-shadow duration-200">
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
                activeFilter !== 'any' ? 'text-cyan-400' : 'text-gray-400'
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
      </form>
    </div>
  );
};

export default ChatInput;