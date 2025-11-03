import React from 'react';
import { LinkIcon } from './Icons';

interface SourceLinkProps {
  source: {
    uri: string;
    title: string;
  };
  index: number;
}

const SourceLink: React.FC<SourceLinkProps> = ({ source, index }) => {
  // Extract domain for display
  let domain = '';
  try {
    domain = new URL(source.uri).hostname.replace(/^www\./, '');
  } catch (e) {
    // keep domain empty if URL is invalid
  }

  return (
    <a
      href={source.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start space-x-3 p-2 rounded-lg hover:bg-[var(--bg-tertiary)]/60 transition-colors duration-200"
      title={source.uri}
    >
      <div className="flex-shrink-0 w-5 h-5 mt-0.5 flex items-center justify-center font-semibold text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-full group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors">
        {index + 1}
      </div>
      <div className="flex-1">
        <p
          className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors duration-200 [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] [overflow:hidden]"
          title={source.title}
        >
            {source.title}
        </p>
        {domain && (
            <div className="flex items-center space-x-1.5 mt-1">
                <LinkIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <p className="text-xs text-[var(--text-muted)] truncate">{domain}</p>
            </div>
        )}
      </div>
    </a>
  );
};

export default SourceLink;