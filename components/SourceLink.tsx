
import React from 'react';

interface SourceLinkProps {
  source: {
    uri: string;
    title: string;
  };
}

const SourceLink: React.FC<SourceLinkProps> = ({ source }) => {
  return (
    <a
      href={source.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs bg-[var(--bg-tertiary)]/50 hover:bg-[var(--bg-tertiary)] text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] px-2.5 py-1.5 rounded-md transition-colors duration-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[240px] sm:max-w-xs"
      title={source.title}
    >
      {source.title}
    </a>
  );
};

export default SourceLink;
