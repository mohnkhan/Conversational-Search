import React, { useState } from 'react';
import { Model, ModelProvider } from '../types';
import { CheckIcon } from './Icons';
import ToggleSwitch from './ToggleSwitch';
import { AVAILABLE_MODELS } from '../App'; // Import from App to avoid new file

interface ModelSelectorProps {
    currentModel: Model;
    onSetModel: (model: Model) => void;
    onClose: () => void;
    prioritizeAuthoritative: boolean;
    onTogglePrioritizeAuthoritative: () => void;
    isOpenAIConfigured: boolean;
    isAnthropicConfigured: boolean;
    isBedrockConfigured: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ currentModel, onSetModel, onClose, prioritizeAuthoritative, onTogglePrioritizeAuthoritative, isOpenAIConfigured, isAnthropicConfigured, isBedrockConfigured }) => {
    const [activeProvider, setActiveProvider] = useState<ModelProvider>(currentModel.provider);

    const googleModels = AVAILABLE_MODELS.filter(m => m.provider === 'google');
    const openAIModels = AVAILABLE_MODELS.filter(m => m.provider === 'openai');
    const anthropicModels = AVAILABLE_MODELS.filter(m => m.provider === 'anthropic');
    const bedrockModels = AVAILABLE_MODELS.filter(m => m.provider === 'bedrock');

    const handleModelChange = (model: Model) => {
        onSetModel(model);
        onClose();
    };
    
    return (
        <div 
            className="absolute top-0 right-full mr-2 w-72 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl z-30 animate-fade-in"
            style={{ animationDuration: '0.2s' }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="p-2">
                <div className="grid grid-cols-4 border-b border-[var(--border-color)] mb-2 text-sm font-medium text-center">
                    <button 
                        onClick={() => setActiveProvider('google')} 
                        className={`p-2 transition-colors ${activeProvider === 'google' ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                        Google
                    </button>
                    <button 
                        onClick={() => setActiveProvider('openai')} 
                        disabled={!isOpenAIConfigured}
                        className={`p-2 transition-colors ${activeProvider === 'openai' ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={!isOpenAIConfigured ? "Set your OpenAI Key in the API Key Manager" : ""}
                    >
                        OpenAI
                    </button>
                    <button 
                        onClick={() => setActiveProvider('anthropic')} 
                        disabled={!isAnthropicConfigured}
                        className={`p-2 transition-colors ${activeProvider === 'anthropic' ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={!isAnthropicConfigured ? "Set your Anthropic Key in the API Key Manager" : ""}
                    >
                        Anthropic
                    </button>
                     <button 
                        onClick={() => setActiveProvider('bedrock')} 
                        disabled={!isBedrockConfigured}
                        className={`p-2 transition-colors ${activeProvider === 'bedrock' ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={!isBedrockConfigured ? "Set your AWS Credentials in the API Key Manager" : ""}
                    >
                        Bedrock
                    </button>
                </div>

                {activeProvider === 'google' && googleModels.map((model) => (
                    <button
                        key={model.id}
                        onClick={() => handleModelChange(model)}
                        className={`w-full text-left p-2 text-sm rounded-md transition-colors ${
                            currentModel.id === model.id
                            ? 'bg-[var(--accent-primary)] text-white' 
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                        }`}
                        aria-pressed={currentModel.id === model.id}
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">{model.name}</span>
                            {currentModel.id === model.id && <CheckIcon className="w-4 h-4" />}
                        </div>
                        <p className={`text-xs mt-1 ${currentModel.id === model.id ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                            {model.description}
                        </p>
                    </button>
                ))}

                {activeProvider === 'openai' && openAIModels.map((model) => (
                    <button
                        key={model.id}
                        onClick={() => handleModelChange(model)}
                        className={`w-full text-left p-2 text-sm rounded-md transition-colors ${
                            currentModel.id === model.id
                            ? 'bg-[var(--accent-primary)] text-white' 
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                        }`}
                        aria-pressed={currentModel.id === model.id}
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">{model.name}</span>
                            {currentModel.id === model.id && <CheckIcon className="w-4 h-4" />}
                        </div>
                        <p className={`text-xs mt-1 ${currentModel.id === model.id ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                            {model.description}
                        </p>
                    </button>
                ))}

                {activeProvider === 'anthropic' && anthropicModels.map((model) => (
                    <button
                        key={model.id}
                        onClick={() => handleModelChange(model)}
                        className={`w-full text-left p-2 text-sm rounded-md transition-colors ${
                            currentModel.id === model.id
                            ? 'bg-[var(--accent-primary)] text-white' 
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                        }`}
                        aria-pressed={currentModel.id === model.id}
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">{model.name}</span>
                            {currentModel.id === model.id && <CheckIcon className="w-4 h-4" />}
                        </div>
                        <p className={`text-xs mt-1 ${currentModel.id === model.id ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                            {model.description}
                        </p>
                    </button>
                ))}
                
                {activeProvider === 'bedrock' && bedrockModels.map((model) => (
                    <button
                        key={model.id}
                        onClick={() => handleModelChange(model)}
                        className={`w-full text-left p-2 text-sm rounded-md transition-colors ${
                            currentModel.id === model.id
                            ? 'bg-[var(--accent-primary)] text-white' 
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                        }`}
                        aria-pressed={currentModel.id === model.id}
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">{model.name}</span>
                            {currentModel.id === model.id && <CheckIcon className="w-4 h-4" />}
                        </div>
                        <p className={`text-xs mt-1 ${currentModel.id === model.id ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                            {model.description}
                        </p>
                    </button>
                ))}

                {activeProvider === 'google' && (
                    <>
                        <div className="my-2 h-px bg-[var(--border-color)]/50"></div>
                        <div className="p-2">
                            <p className="pb-2 text-xs font-semibold text-[var(--text-muted)]">Google Search Settings</p>
                            <ToggleSwitch
                                id="authoritative-toggle"
                                label="Prioritize Authoritative Sources"
                                description="Guides the model to prefer .gov, .edu, etc. and filter out social/blog sites."
                                checked={prioritizeAuthoritative}
                                onChange={onTogglePrioritizeAuthoritative}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ModelSelector;