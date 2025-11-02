import React from 'react';
import { ModelId } from '../types';
import { CheckIcon } from './Icons';
import ToggleSwitch from './ToggleSwitch';

interface ModelSelectorProps {
    currentModel: ModelId;
    onSetModel: (model: ModelId) => void;
    onClose: () => void;
    prioritizeAuthoritative: boolean;
    onTogglePrioritizeAuthoritative: () => void;
}

const availableModels: { id: ModelId; name: string; description: string }[] = [
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Fast and cost-effective for most tasks.',
    },
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'Most capable for complex reasoning.',
    },
];

const ModelSelector: React.FC<ModelSelectorProps> = ({ currentModel, onSetModel, onClose, prioritizeAuthoritative, onTogglePrioritizeAuthoritative }) => {

    const handleModelChange = (id: ModelId) => {
        onSetModel(id);
        onClose();
    };
    
    return (
        <div 
            className="absolute top-0 right-full mr-2 w-72 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl z-30 animate-fade-in"
            style={{ animationDuration: '0.2s' }}
            onMouseDown={(e) => e.stopPropagation()} // Prevent outside click handler from firing on self
        >
            <div className="p-2">
                <p className="px-2 py-1 text-xs font-semibold text-[var(--text-muted)]">Select Model</p>
                {availableModels.map((model) => (
                    <button
                        key={model.id}
                        onClick={() => handleModelChange(model.id)}
                        className={`w-full text-left p-2 text-sm rounded-md transition-colors ${
                            currentModel === model.id 
                            ? 'bg-[var(--accent-primary)] text-white' 
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                        }`}
                        aria-pressed={currentModel === model.id}
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">{model.name}</span>
                            {currentModel === model.id && <CheckIcon className="w-4 h-4" />}
                        </div>
                        <p className={`text-xs mt-1 ${currentModel === model.id ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                            {model.description}
                        </p>
                    </button>
                ))}
                <div className="my-2 h-px bg-[var(--border-color)]/50"></div>
                <div className="p-2">
                    <p className="pb-2 text-xs font-semibold text-[var(--text-muted)]">Advanced Settings</p>
                    <ToggleSwitch
                        id="authoritative-toggle"
                        label="Prioritize Authoritative Sources"
                        description="Guides the model to prefer .gov, .edu, and other high-quality sources. Filters out common social/blog sites."
                        checked={prioritizeAuthoritative}
                        onChange={onTogglePrioritizeAuthoritative}
                    />
                </div>
            </div>
        </div>
    );
};

export default ModelSelector;