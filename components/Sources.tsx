import React from 'react';
import { Source } from '../types';
import SourceLink from './SourceLink';

interface SourcesProps {
  sources: Source[];
}

const Sources: React.FC<SourcesProps> = ({ sources }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="text-sm font-semibold text-gray-400 mb-2">
        Sources
      </p>
      <div className="flex overflow-x-auto gap-2 pb-2">
        {sources.map((source, index) =>
          source.web ? <SourceLink key={index} source={source.web} /> : null
        )}
      </div>
    </div>
  );
};

export default Sources;
