import React from 'react';
import { LightbulbIcon } from './Icons';

interface SuggestedPromptsProps {
  prompts: string[];
  onPromptClick: (prompt: string) => void;
}

const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ prompts, onPromptClick }) => {
  if (prompts.length === 0) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto my-4 animate-fade-in pl-12">
      <h2 className="text-sm font-semibold text-[var(--text-muted)] flex items-center space-x-2 mb-3">
        <LightbulbIcon className="w-4 h-4" />
        <span>Suggested Prompts</span>
      </h2>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onPromptClick(prompt)}
            className="text-xs sm:text-sm bg-[var(--bg-secondary)]/60 backdrop-blur-sm hover:bg-[var(--bg-tertiary)]/60 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all duration-200"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedPrompts;