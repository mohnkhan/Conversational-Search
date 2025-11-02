import React, { useEffect, useRef } from 'react';
import { BotIcon, SparklesIcon } from './Icons';

interface ApiKeySelectorProps {
    onKeySelected: () => void;
    title?: string;
    description?: string;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected, title, description }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const modalElement = modalRef.current;
        if (!modalElement) return;

        const focusableElements = modalElement.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        firstElement.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) { // Shift + Tab
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else { // Tab
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
    }, []);

    const handleSelectKey = async () => {
        try {
            await window.aistudio.openSelectKey();
            // Assume the user selected a key and close the modal optimistically.
            // The main App component will handle API errors if the key is invalid.
            onKeySelected();
        } catch (error) {
            console.error("Error opening API key selection dialog:", error);
            // Optionally, show an error message to the user here.
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div
                ref={modalRef}
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl w-full max-w-md text-center p-8"
                role="dialog"
                aria-modal="true"
                aria-labelledby="api-key-modal-title"
            >
                <div className="flex justify-center mb-4">
                    <div className="p-3 bg-[var(--bg-accent-translucent)] rounded-full">
                        <BotIcon className="w-10 h-10 text-[var(--accent-primary)]" />
                    </div>
                </div>
                <h2 id="api-key-modal-title" className="text-2xl font-bold text-[var(--text-primary)] mb-2">{title || 'API Key Required'}</h2>
                <p className="text-[var(--text-muted)] mb-6">
                    {description || 'An API key from a project with billing enabled is required for this operation. Please select a valid key to continue.'}
                </p>
                <div className="space-y-4">
                    <button
                        onClick={handleSelectKey}
                        className="w-full px-5 py-3 rounded-lg text-md font-semibold text-white bg-[var(--accent-primary)] hover:opacity-90 transition-all flex items-center justify-center space-x-2"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        <span>Select API Key</span>
                    </button>
                    <a
                        href="https://ai.google.dev/gemini-api/docs/billing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                    >
                        Learn more about billing for Gemini API
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ApiKeySelector;