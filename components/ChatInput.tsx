
import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, FilterIcon } from './Icons';
import { DateFilter } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  activeFilter: DateFilter;
  onFilterChange: (filter: DateFilter) => void;
}

const filterOptions: { key: DateFilter, label: string }[] = [
    { key: 'any', label: 'Any time' },
    { key: 'day', label: 'Past 24 hours' },
    { key: 'week', label: 'Past week' },
    { key: 'month', label: 'Past month' },
    { key: 'year', label: 'Past year' },
];

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, activeFilter, onFilterChange }) => {
  const [text, setText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text);
      setText('');
    }
  };

  const handleFilterSelect = (filter: DateFilter) => {
    onFilterChange(filter);
    setShowFilters(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      {showFilters && (
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
      <form onSubmit={handleSubmit} className="flex items-center space-x-2 sm:space-x-3 bg-gray-800 border border-gray-700 rounded-lg p-2 focus-within:ring-2 focus-within:ring-cyan-500 transition-shadow duration-200">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask me anything..."
          className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none px-2 text-sm sm:text-base"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          aria-controls="filter-menu"
          aria-label="Open search filters"
          className={`p-2 rounded-md hover:bg-gray-700/80 transition-colors duration-200 ${
            activeFilter !== 'any' ? 'text-cyan-400' : 'text-gray-400'
          }`}
        >
          <FilterIcon className="w-5 h-5" />
        </button>
        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          className="p-2 rounded-md bg-cyan-600 text-white hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;