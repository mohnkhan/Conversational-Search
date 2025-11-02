import React, { useEffect, useRef, useState } from 'react';
import { XIcon, KeyIcon, RefreshCwIcon, TrashIcon, CheckIcon } from './Icons';

interface ApiKeyManagerProps {
    onClose: () => void;
    onChangeKey: () => void;
    onClearKey: () => void;
    isKeySelected: boolean;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onClose, onChangeKey, onClearKey, isKeySelected }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [maskedKey, setMaskedKey] = useState<string>('Checking...');

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
        // This effect runs asynchronously to avoid potential timing issues with `process.env` updates.
        setTimeout(() => {
            const key = process.env.API_KEY;
            if (isKeySelected && key) {
                const masked = `${key.substring(0, 5)}...${key.substring(key.length - 4)}`;
                setMaskedKey(masked);
            } else {
                setMaskedKey('No key selected');
            }
        }, 0);
    }, [isKeySelected]);

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
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
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>

                <main className="p-6 space-y-4">
                    <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-color)]">
                        <p className="text-sm text-[var(--text-muted)]">Current Billed API Key</p>
                        <p className="font-mono text-lg text-[var(--text-primary)] mt-1 truncate" title={isKeySelected ? "Current active key" : "No key selected"}>
                            {maskedKey}
                        </p>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] text-center">
                        This API key is used for features that require billing, like video generation. It is managed by the AI Studio environment and is not stored by this application.
                    </p>
                </main>

                <footer className="flex items-center justify-between p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
                    <button
                        onClick={onClearKey}
                        disabled={!isKeySelected}
                        className="px-4 py-2 rounded-md text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)]/80 hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                        aria-label="Clear selected API key"
                    >
                        <TrashIcon className="w-4 h-4" />
                        <span>Clear Key</span>
                    </button>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={onChangeKey}
                            className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-[var(--accent-primary)] hover:opacity-90 transition-all flex items-center space-x-2"
                            aria-label="Change selected API key"
                        >
                            <RefreshCwIcon className="w-4 h-4" />
                            <span>Change Key</span>
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ApiKeyManager;