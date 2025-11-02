import React, { useEffect, useRef } from 'react';
import { XIcon, HelpCircleIcon } from './Icons';

interface KeyboardShortcutsModalProps {
    onClose: () => void;
}

const shortcuts = [
    { keys: ['Enter'], description: 'Send message' },
    { keys: ['Shift', 'Enter'], description: 'Add a new line' },
    { keys: ['Ctrl', 'K'], description: 'Clear the entire chat' },
    { keys: ['F'], description: 'Toggle search filter menu' },
    { keys: ['Ctrl', 'B'], description: 'Apply bold formatting' },
    { keys: ['Ctrl', 'I'], description: 'Apply italic formatting' },
    { keys: ['Ctrl', 'E'], description: 'Apply code block formatting' },
    { keys: ['Esc'], description: 'Close modals & popups' },
    { keys: ['?'], description: 'Show this help menu' },
];

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ onClose }) => {
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

    const renderKeys = (keys: string[]) => {
        const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
        return keys.map((key, index) => (
            <React.Fragment key={key}>
                <kbd className="px-2 py-1 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md">
                    {key === 'Ctrl' && isMac ? 'Cmd' : key}
                </kbd>
                {index < keys.length - 1 && <span className="mx-1 text-[var(--text-muted)]">+</span>}
            </React.Fragment>
        ));
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
            aria-labelledby="shortcuts-modal-title"
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
                        <HelpCircleIcon className="w-6 h-6 text-[var(--accent-primary)]" />
                        <h2 id="shortcuts-modal-title" className="text-lg font-semibold text-[var(--text-primary)]">
                            Keyboard Shortcuts
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                        aria-label="Close shortcuts"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>

                <main className="p-6 overflow-y-auto">
                    <ul className="space-y-3">
                        {shortcuts.map(shortcut => (
                            <li key={shortcut.description} className="flex items-center justify-between">
                                <span className="text-sm text-[var(--text-primary)]">{shortcut.description}</span>
                                <div className="flex items-center">
                                    {renderKeys(shortcut.keys)}
                                </div>
                            </li>
                        ))}
                    </ul>
                </main>
            </div>
        </div>
    );
};

export default KeyboardShortcutsModal;