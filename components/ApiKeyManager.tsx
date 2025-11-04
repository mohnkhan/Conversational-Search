import React, { useEffect, useRef, useState } from 'react';
import { XIcon, KeyIcon, CheckIcon, TrashIcon, RefreshCwIcon } from './Icons';

interface ApiKeyManagerProps {
    onClose: () => void;
    onChangeKey: () => void;
    onClearKey: () => void;
    isKeySelected: boolean;
    openAIApiKey: string | null;
    onSaveOpenAIKey: (key: string) => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onClose, onChangeKey, onClearKey, isKeySelected, openAIApiKey, onSaveOpenAIKey }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [googleMaskedKey, setGoogleMaskedKey] = useState<string>('Checking...');
    const [openAIKeyInput, setOpenAIKeyInput] = useState(openAIApiKey || '');
    const [isOAIKeySaved, setIsOAIKeySaved] = useState(false);

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
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Tab') {
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
    }, [onClose]);

    useEffect(() => {
        setTimeout(() => {
            const key = process.env.API_KEY;
            if (isKeySelected && key) {
                const masked = `${key.substring(0, 5)}...${key.substring(key.length - 4)}`;
                setGoogleMaskedKey(masked);
            } else {
                setGoogleMaskedKey('No key selected');
            }
        }, 0);
    }, [isKeySelected]);

    const handleSaveOpenAI = () => {
        onSaveOpenAIKey(openAIKeyInput.trim());
        setIsOAIKeySaved(true);
        setTimeout(() => setIsOAIKeySaved(false), 2000);
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
            aria-labelledby="api-key-manager-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl w-full max-w-md flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                    <div className="flex items-center space-x-3">
                        <KeyIcon className="w-6 h-6 text-[var(--accent-primary)]" />
                        <h2 id="api-key-manager-title" className="text-lg font-semibold text-[var(--text-primary)]">
                            API Key Management
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                        aria-label="Close API Key Manager"
                        title="Close"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>

                <main className="p-6 space-y-6">
                    {/* Google API Key Section */}
                    <div>
                        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">Google AI</h3>
                        <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-color)]">
                            <p className="text-sm text-[var(--text-muted)]">Current Billed API Key (for Video)</p>
                            <p className="font-mono text-base text-[var(--text-primary)] mt-1 truncate" title={isKeySelected ? "Current active key" : "No key selected"}>
                                {googleMaskedKey}
                            </p>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-2">
                            This key is required for video generation and is managed via the AI Studio environment.
                        </p>
                         <div className="flex items-center space-x-2 mt-3">
                            <button onClick={onChangeKey} className="flex-1 px-4 py-2 rounded-md text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)]/80 hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-center space-x-2">
                                <RefreshCwIcon className="w-4 h-4" />
                                <span>Change Key</span>
                            </button>
                            <button onClick={onClearKey} disabled={!isKeySelected} className="flex-1 px-4 py-2 rounded-md text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)]/80 hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2">
                                <TrashIcon className="w-4 h-4" />
                                <span>Clear Key</span>
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-[var(--border-color)]"></div>

                    {/* OpenAI API Key Section */}
                    <div>
                        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">OpenAI</h3>
                         <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-color)]">
                            <label htmlFor="openai-key-input" className="text-sm text-[var(--text-muted)]">Your OpenAI API Key</label>
                            <input
                                id="openai-key-input"
                                type="password"
                                value={openAIKeyInput}
                                onChange={(e) => setOpenAIKeyInput(e.target.value)}
                                placeholder="sk-..."
                                className="w-full bg-transparent font-mono text-base text-[var(--text-primary)] mt-1 focus:outline-none"
                            />
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-2">
                           Your key is stored securely in your browser's local storage and is never sent anywhere except to OpenAI.
                        </p>
                        <div className="flex justify-end mt-3">
                             <button
                                onClick={handleSaveOpenAI}
                                className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-[var(--accent-primary)] hover:opacity-90 transition-all flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                disabled={openAIKeyInput === openAIApiKey}
                            >
                                {isOAIKeySaved ? <CheckIcon className="w-4 h-4" /> : null}
                                <span>{isOAIKeySaved ? 'Saved!' : 'Save OpenAI Key'}</span>
                            </button>
                        </div>
                    </div>
                </main>

                 <footer className="flex items-center justify-end p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
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

export default ApiKeyManager;
