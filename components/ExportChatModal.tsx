import React, { useEffect, useRef, useState } from 'react';
import { XIcon, DownloadIcon, FileTextIcon, BracesIcon, MarkdownIcon } from './Icons';
import { ChatMessage } from '../types';

interface ExportChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    messages: ChatMessage[];
}

type ExportFormat = 'txt' | 'json' | 'md';

// --- Helper Functions ---

const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const formatAsTxt = (messages: ChatMessage[]): string => {
    return messages.map(msg => {
        const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : 'No timestamp';
        let content = msg.text;
        if (msg.imageUrl) content = `[Image Prompt: ${msg.text}]`;
        if (msg.videoUrl) content = `[Video Prompt: ${msg.text}]`;
        
        return `[${timestamp}] ${msg.role.toUpperCase()}:\n${content}\n`;
    }).join('\n---\n');
};

const formatAsJson = (messages: ChatMessage[]): string => {
    return JSON.stringify(messages, null, 2);
};

const formatAsMd = (messages: ChatMessage[]): string => {
    return messages.map(msg => {
        const timestamp = msg.timestamp ? `*${new Date(msg.timestamp).toLocaleString()}*` : '';
        let content = msg.text;

        if (msg.imageUrl) {
            content = `> **Image Prompt:** ${msg.text}\n\n*An image was generated but is not embedded in this export.*`;
        } else if (msg.videoUrl) {
            content = `> **Video Prompt:** ${msg.text}\n\n*A video was generated but is not embedded in this export.*`;
        }

        if (msg.role === 'user') {
            return `**You** (${timestamp})\n\n> ${content.replace(/\n/g, '\n> ')}\n`;
        } else {
            let sourcesText = '';
            if (msg.sources && msg.sources.length > 0) {
                sourcesText = '\n\n**Sources:**\n' + msg.sources.map(s => `- [${s.web?.title}](${s.web?.uri})`).join('\n');
            }
            return `**Assistant** (${timestamp})\n\n${content}${sourcesText}\n`;
        }
    }).join('\n---\n\n');
};


// --- Component ---

const ExportChatModal: React.FC<ExportChatModalProps> = ({ isOpen, onClose, messages }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [format, setFormat] = useState<ExportFormat>('txt');
    const [dateOption, setDateOption] = useState<'all' | 'custom'>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (!isOpen) return;

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
    }, [isOpen, onClose]);

    const handleExport = () => {
        let filteredMessages = messages;
        if (dateOption === 'custom' && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include the whole end day

            filteredMessages = messages.filter(msg => {
                if (!msg.timestamp) return false;
                const msgDate = new Date(msg.timestamp);
                return msgDate >= start && msgDate <= end;
            });
        }

        let content = '';
        let filename = `chat-history-${new Date().toISOString().split('T')[0]}`;
        let mimeType = 'text/plain';

        switch (format) {
            case 'txt':
                content = formatAsTxt(filteredMessages);
                filename += '.txt';
                mimeType = 'text/plain';
                break;
            case 'json':
                content = formatAsJson(filteredMessages);
                filename += '.json';
                mimeType = 'application/json';
                break;
            case 'md':
                content = formatAsMd(filteredMessages);
                filename += '.md';
                mimeType = 'text/markdown';
                break;
        }

        downloadFile(content, filename, mimeType);
        onClose();
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
            aria-labelledby="export-modal-title"
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
                        <DownloadIcon className="w-6 h-6 text-[var(--accent-primary)]" />
                        <h2 id="export-modal-title" className="text-lg font-semibold text-[var(--text-primary)]">
                            Export Chat History
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                        aria-label="Close export modal"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>

                <main className="p-6 space-y-6">
                    <div>
                        <p className="text-sm font-semibold text-[var(--text-secondary)] mb-2">File Format</p>
                        <div className="grid grid-cols-3 gap-2">
                           <FormatButton icon={<FileTextIcon className="w-5 h-5"/>} label="TXT" value="txt" selected={format} onSelect={setFormat}/>
                           <FormatButton icon={<BracesIcon className="w-5 h-5"/>} label="JSON" value="json" selected={format} onSelect={setFormat}/>
                           <FormatButton icon={<MarkdownIcon className="w-5 h-5"/>} label="Markdown" value="md" selected={format} onSelect={setFormat}/>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Date Range</p>
                        <div className="flex flex-col space-y-3">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="radio" name="date-option" value="all" checked={dateOption === 'all'} onChange={() => setDateOption('all')} className="w-4 h-4 text-[var(--accent-primary)] bg-[var(--bg-tertiary)] border-[var(--border-color)] focus:ring-[var(--accent-primary)]" />
                                <span className="text-sm text-[var(--text-primary)]">All Time</span>
                            </label>
                             <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="radio" name="date-option" value="custom" checked={dateOption === 'custom'} onChange={() => setDateOption('custom')} className="w-4 h-4 text-[var(--accent-primary)] bg-[var(--bg-tertiary)] border-[var(--border-color)] focus:ring-[var(--accent-primary)]"/>
                                <span className="text-sm text-[var(--text-primary)]">Custom Range</span>
                            </label>
                            {dateOption === 'custom' && (
                                <div className="grid grid-cols-2 gap-3 pl-7 animate-fade-in">
                                    <div>
                                        <label htmlFor="start-date" className="block text-xs text-[var(--text-muted)] mb-1">Start Date</label>
                                        <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} max={endDate || today} className="w-full text-sm" />
                                    </div>
                                    <div>
                                        <label htmlFor="end-date" className="block text-xs text-[var(--text-muted)] mb-1">End Date</label>
                                        <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} max={today} className="w-full text-sm" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                <footer className="flex items-center justify-end p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50 space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={dateOption === 'custom' && (!startDate || !endDate)}
                        className="px-5 py-2 rounded-md text-sm font-semibold text-white bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        <span>Export</span>
                    </button>
                </footer>
            </div>
        </div>
    );
};

interface FormatButtonProps {
    icon: React.ReactNode;
    label: string;
    value: ExportFormat;
    selected: ExportFormat;
    onSelect: (format: ExportFormat) => void;
}

const FormatButton: React.FC<FormatButtonProps> = ({ icon, label, value, selected, onSelect }) => (
    <button
        onClick={() => onSelect(value)}
        className={`flex flex-col items-center justify-center space-y-1.5 p-3 rounded-md transition-colors duration-200 border-2 ${
            selected === value
                ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : 'bg-[var(--bg-tertiary)]/60 border-transparent hover:border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
        aria-pressed={selected === value}
    >
        {icon}
        <span className="text-xs font-medium">{label}</span>
    </button>
);

export default ExportChatModal;