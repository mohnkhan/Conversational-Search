import React, { useState } from 'react';
import { Source } from '../types';
import SourceLink from './SourceLink';
import { ChevronDownIcon, LinkIcon } from './Icons';

interface SourcesProps {
  sources: Source[];
}

const Sources: React.FC<SourcesProps> = ({ sources }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left text-sm font-semibold text-[var(--text-muted)] mb-2 focus:outline-none hover:text-[var(--text-secondary)] transition-colors duration-200"
        aria-expanded={isOpen}
        aria-controls="sources-list"
      >
        <div className="flex items-center">
            <LinkIcon className="w-4 h-4 mr-2" />
            <span>Sources ({sources.length})</span>
        </div>
        <ChevronDownIcon
          className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div id="sources-list" className="space-y-1 animate-fade-in">
          {sources.map((source, index) =>
            source.web ? <SourceLink key={index} source={source.web} index={index} /> : null
          )}
        </div>
      )}
    </div>
  );
};

export default Sources;