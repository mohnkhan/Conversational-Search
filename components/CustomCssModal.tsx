import React, { useEffect, useRef, useState } from 'react';
import { XIcon, FileCodeIcon, TrashIcon } from './Icons';

interface CustomCssModalProps {
    onClose: () => void;
    onSave: (css: string) => void;
    initialCss: string;
}

const CustomCssModal: React.FC<CustomCssModalProps> = ({ onClose, onSave, initialCss }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [cssText, setCssText] = useState(initialCss);

    useEffect(() => {
        const modalElement = modalRef.current;
        if (!modalElement) return;

        const focusableElements = modalElement.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        // Focus the textarea initially
        const textarea = modalElement.querySelector('textarea');
        if (textarea) {
            textarea.focus();
        } else {
            firstElement.focus();
        }

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
    
    const handleSave = () => {
        onSave(cssText);
    };

    const handleClear = () => {
        setCssText('');
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
            aria-labelledby="css-modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl w-full max-w-lg flex flex-col h-[80vh]"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-[var(--border-color)] flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <FileCodeIcon className="w-6 h-6 text-[var(--accent-primary)]" />
                        <h2 id="css-modal-title" className="text-lg font-semibold text-[var(--text-primary)]">
                            Custom Styles (CSS)
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                        aria-label="Close custom CSS editor"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>

                <main className="p-4 flex-1 flex flex-col overflow-y-auto">
                    <p className="text-sm text-[var(--text-muted)] mb-3">
                        Add your own CSS rules below. Changes will be applied instantly and saved locally.
                    </p>
                    <textarea
                        value={cssText}
                        onChange={(e) => setCssText(e.target.value)}
                        placeholder={`/* Example: */\n\n.prose-themed h1 {\n  color: hotpink;\n}`}
                        className="w-full h-full flex-1 bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] font-mono text-sm border border-[var(--border-color)] rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] resize-none"
                        spellCheck="false"
                        aria-label="Custom CSS input"
                    />
                </main>

                <footer className="flex items-center justify-between p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50 flex-shrink-0">
                    <button
                        onClick={handleClear}
                        className="px-4 py-2 rounded-md text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)]/80 hover:bg-[var(--bg-tertiary)] transition-colors flex items-center space-x-2"
                        aria-label="Clear all custom CSS"
                    >
                        <TrashIcon className="w-4 h-4" />
                        <span>Clear</span>
                    </button>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-5 py-2 rounded-md text-sm font-semibold text-white bg-[var(--accent-primary)] hover:opacity-90 transition-all"
                        >
                            Save & Close
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default CustomCssModal;