import React, { useEffect, useRef } from 'react';
import { BotIcon, SparklesIcon } from './Icons';

interface ApiKeySelectorProps {
    onKeySelected: () => void;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div
                ref={modalRef}
                className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-md text-center p-8"
                role="dialog"
                aria-modal="true"
                aria-labelledby="api-key-modal-title"
            >
                <div className="flex justify-center mb-4">
                    <div className="p-3 bg-cyan-500/20 rounded-full">
                        <BotIcon className="w-10 h-10 text-cyan-400" />
                    </div>
                </div>
                <h2 id="api-key-modal-title" className="text-2xl font-bold text-white mb-2">API Key Required for Video</h2>
                <p className="text-gray-400 mb-6">
                    To use the video generation feature with the Veo model, you must select an API key from a project with billing enabled.
                </p>
                <div className="space-y-4">
                    <button
                        onClick={handleSelectKey}
                        className="w-full px-5 py-3 rounded-lg text-md font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors flex items-center justify-center space-x-2"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        <span>Select API Key</span>
                    </button>
                    <a
                        href="https://ai.google.dev/gemini-api/docs/billing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-500 hover:text-cyan-400 transition-colors"
                    >
                        Learn more about billing for Gemini API
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ApiKeySelector;