import React, { useState } from 'react';
import { Source } from '../types';
import SourceLink from './SourceLink';
import { LinkIcon, ChevronDownIcon } from './Icons';

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
        className="flex items-center text-sm font-semibold text-gray-400 hover:text-gray-200 transition-colors w-full text-left"
        aria-expanded={isOpen}
        aria-controls="sources-list"
      >
        <LinkIcon className="w-4 h-4 mr-2 flex-shrink-0" />
        <span className="flex-grow">Sources ({sources.length})</span>
        <ChevronDownIcon className={`w-5 h-5 ml-2 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div 
        id="sources-list"
        className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
      >
        <div className="flex flex-wrap gap-2 pt-1">
          {sources.map((source, index) =>
            source.web ? <SourceLink key={index} source={source.web} /> : null
          )}
        </div>
      </div>
    </div>
  );
};

export default Sources;