import React from 'react';
import { SparklesIcon } from './Icons';

interface RelatedTopicsProps {
  topics: string[];
  onTopicClick: (topic: string) => void;
}

const RelatedTopics: React.FC<RelatedTopicsProps> = ({ topics, onTopicClick }) => {
  if (topics.length === 0) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto my-4 animate-fade-in pl-12">
      <h2 className="text-sm font-semibold text-[var(--text-muted)] flex items-center space-x-2 mb-3">
        <SparklesIcon className="w-4 h-4" />
        <span>Related Topics</span>
      </h2>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {topics.map((topic, index) => (
          <button
            key={index}
            onClick={() => onTopicClick(topic)}
            className="text-xs sm:text-sm bg-[var(--bg-secondary)]/60 backdrop-blur-sm hover:bg-[var(--bg-tertiary)]/60 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all duration-200"
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RelatedTopics;