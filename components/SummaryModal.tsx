import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { XIcon, ClipboardListIcon, CopyIcon, CheckIcon } from './Icons';
import CodeBlock from './CodeBlock';

interface SummaryModalProps {
    onClose: () => void;
    summary: string | null;
    isLoading: boolean;
}

const SummaryModal: React.FC<SummaryModalProps> = ({ onClose, summary, isLoading }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [isCopied, setIsCopied] = useState(false);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!modalRef.current) return;
        
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        closeButtonRef.current?.focus();
        
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
    
    const handleCopy = () => {
        if (!summary) return;
        navigator.clipboard.writeText(summary).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
            aria-labelledby="summary-modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl w-full max-w-2xl flex flex-col h-[70vh]"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-[var(--border-color)] flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <ClipboardListIcon className="w-6 h-6 text-[var(--accent-primary)]" />
                        <h2 id="summary-modal-title" className="text-lg font-semibold text-[var(--text-primary)]">
                            Conversation Summary
                        </h2>
                    </div>
                    <button
                        ref={closeButtonRef}
                        onClick={onClose}
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                        aria-label="Close summary"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>

                <main className="p-6 flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center space-y-2">
                                <div className="w-8 h-8 border-4 border-[var(--border-color)] border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                                <p className="text-[var(--text-muted)]">Generating summary...</p>
                            </div>
                        </div>
                    ) : summary ? (
                        <div className="prose prose-themed max-w-none">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{ code: CodeBlock }}
                            >
                                {summary}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <div className="text-center text-[var(--text-muted)]">
                            <p>No summary available or an error occurred.</p>
                        </div>
                    )}
                </main>

                <footer className="flex items-center justify-between p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50 flex-shrink-0">
                    <button
                        onClick={handleCopy}
                        disabled={!summary || isLoading}
                        className="px-4 py-2 rounded-md text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)]/80 hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                        {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                        <span>{isCopied ? 'Copied!' : 'Copy Summary'}</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-md text-sm font-semibold text-white bg-[var(--accent-primary)] hover:opacity-90 transition-all"
                    >
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SummaryModal;