import React from 'react';
import { ResearchScope } from '../types';
import { SparklesIcon, PlusMinusIcon, HistoryIcon, GitCompareArrowsIcon, CodeIcon, XIcon, CheckIcon } from './Icons';

interface DeepResearchPanelProps {
    currentScope: ResearchScope | null;
    onSelect: (scope: ResearchScope) => void;
    onClear: () => void;
}

const researchScopes: { id: ResearchScope; name: string; description: string; icon: React.FC<any> }[] = [
    {
        id: 'comprehensive',
        name: 'Comprehensive Analysis',
        description: 'Get a detailed, multi-faceted overview of a topic.',
        icon: SparklesIcon,
    },
    {
        id: 'pros-cons',
        name: 'Pros & Cons',
        description: 'Receive a balanced, two-sided view of a subject.',
        icon: PlusMinusIcon,
    },
    {
        id: 'historical',
        name: 'Historical Context',
        description: 'Understand the origin, evolution, and timeline of a topic.',
        icon: HistoryIcon,
    },
    {
        id: 'compare-contrast',
        name: 'Compare & Contrast',
        description: 'See a structured comparison of multiple items.',
        icon: GitCompareArrowsIcon,
    },
    {
        id: 'technical',
        name: 'Technical Deep-Dive',
        description: 'For code, formulas, or highly specific information.',
        icon: CodeIcon,
    },
];

const DeepResearchPanel: React.FC<DeepResearchPanelProps> = ({ currentScope, onSelect, onClear }) => {
    return (
        <div 
            className="absolute bottom-full mb-2 w-full sm:w-80 right-0 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl z-10 animate-fade-in"
            style={{ animationDuration: '0.2s' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="research-panel-title"
        >
            <div className="p-3">
                <h2 id="research-panel-title" className="text-sm font-semibold text-[var(--text-primary)] mb-2 px-2">
                    Deep Research Mode
                </h2>
                <p className="text-xs text-[var(--text-muted)] mb-3 px-2">
                    Select a scope to get a more detailed analysis using Gemini 2.5 Pro.
                </p>
                <div className="space-y-1">
                    {researchScopes.map(scope => (
                        <button
                            key={scope.id}
                            onClick={() => onSelect(scope.id)}
                            className={`w-full text-left p-2 flex items-center space-x-3 rounded-md transition-colors ${
                                currentScope === scope.id 
                                    ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                            }`}
                        >
                            <scope.icon className="w-5 h-5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">{scope.name}</p>
                                <p className={`text-xs ${currentScope === scope.id ? 'text-[var(--accent-primary)]/80' : 'text-[var(--text-muted)]'}`}>
                                    {scope.description}
                                </p>
                            </div>
                            {currentScope === scope.id && <CheckIcon className="w-5 h-5 flex-shrink-0" />}
                        </button>
                    ))}
                </div>
                {currentScope && (
                    <>
                        <div className="my-2 h-px bg-[var(--border-color)]/50"></div>
                        <button
                            onClick={onClear}
                            className="w-full flex items-center justify-center space-x-2 p-2 text-sm rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-danger)]"
                        >
                            <XIcon className="w-4 h-4"/>
                            <span>Disable Deep Research</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default DeepResearchPanel;