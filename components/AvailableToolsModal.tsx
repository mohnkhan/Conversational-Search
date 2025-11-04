import React, { useEffect, useRef } from 'react';
import { XIcon, CogIcon } from './Icons';
import { getAvailableTools } from '../services/tools';
import { Type } from '@google/genai';

interface AvailableToolsModalProps {
    onClose: () => void;
}

// Dummy functions for displaying tool info, they won't be executed.
const AVAILABLE_TOOLS_FOR_DISPLAY = getAvailableTools({ 
    handleAddTask: () => {}, 
    getCurrentWeather: async () => '' 
});

const formatParameters = (properties: any, required: string[] = []): string => {
    if (!properties) return 'None';
    return Object.entries(properties).map(([key, value]: [string, any]) => {
        const isRequired = required.includes(key);
        const type = value.type.toLowerCase();
        return `${key}: ${type}${isRequired ? '' : ' (optional)'}`;
    }).join(', ');
};

const AvailableToolsModal: React.FC<AvailableToolsModalProps> = ({ onClose }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const modalElement = modalRef.current;
        if (!modalElement) return;

        const focusableElements = modalElement.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        firstElement.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
            aria-labelledby="tools-modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl w-full max-w-lg flex flex-col h-[70vh]"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-[var(--border-color)] flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <CogIcon className="w-6 h-6 text-[var(--accent-primary)]" />
                        <h2 id="tools-modal-title" className="text-lg font-semibold text-[var(--text-primary)]">
                            Available AI Tools
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                        aria-label="Close available tools modal"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>

                <main className="p-4 flex-1 overflow-y-auto">
                    <p className="text-sm text-[var(--text-muted)] mb-4 px-2">
                        The AI can use these tools to perform actions or get information from external sources.
                    </p>
                    <div className="space-y-3">
                        {AVAILABLE_TOOLS_FOR_DISPLAY.map(tool => (
                            <div key={tool.name} className="bg-[var(--bg-primary)] p-4 rounded-lg border border-[var(--border-color)]">
                                <div className="flex items-center space-x-3 mb-2">
                                    <tool.icon className="w-6 h-6 text-[var(--accent-primary)] flex-shrink-0" />
                                    <h3 className="font-semibold text-base text-[var(--text-primary)]">{tool.name}</h3>
                                </div>
                                <p className="text-sm text-[var(--text-secondary)] mb-3">{tool.description}</p>
                                <div className="bg-[var(--bg-secondary)] p-2 rounded-md">
                                    <p className="text-xs font-semibold text-[var(--text-muted)]">Parameters:</p>
                                    <code className="text-xs text-[var(--text-primary)] font-mono mt-1 block">
                                        {formatParameters(tool.schema.parameters.properties, tool.schema.parameters.required)}
                                    </code>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>

                <footer className="flex items-center justify-end p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)]/80 hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AvailableToolsModal;
