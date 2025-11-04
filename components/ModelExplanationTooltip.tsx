import React, { useEffect, useState } from 'react';
import { Model } from '../types';
import { LightbulbIcon, XIcon } from './Icons';

interface ModelExplanationTooltipProps {
    model: Model | null;
    isVisible: boolean;
    onClose: () => void;
}

const ModelExplanationTooltip: React.FC<ModelExplanationTooltipProps> = ({ model, isVisible, onClose }) => {
    const [shouldRender, setShouldRender] = useState(isVisible);

    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
        } else {
            const timer = setTimeout(() => setShouldRender(false), 300); // Match animation duration
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    if (!shouldRender || !model) return null;
    
    return (
        <div
            className={`fixed top-20 right-4 sm:right-6 w-full max-w-sm p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-2xl z-50 transition-all duration-300 ease-out ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
            }`}
            role="status"
            aria-live="polite"
        >
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[var(--accent-primary)]/20">
                    <LightbulbIcon className="w-5 h-5 text-[var(--accent-primary)]" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Model Switched to {model.name}</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{model.description}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                    aria-label="Dismiss model explanation"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default ModelExplanationTooltip;
