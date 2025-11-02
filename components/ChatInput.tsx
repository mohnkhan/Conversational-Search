// FIX: Added 'useCallback' to the import from 'react' to resolve the 'Cannot find name' error.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SendIcon, FilterIcon, XIcon, BoldIcon, ItalicIcon, CodeIcon, SparklesIcon, MicrophoneIcon } from './Icons';
import { DateFilter, PredefinedDateFilter } from '../types';
import FilterPanel from './FilterPanel';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  activeFilter: DateFilter;
  onFilterChange: (filter: DateFilter) => void;
  isFilterMenuOpen: boolean;
  onToggleFilterMenu: () => void;
  onCloseFilterMenu: () => void;
  placeholder?: string;
  isDeepResearch: boolean;
  onToggleDeepResearch: () => void;
}

const filterOptions: { key: PredefinedDateFilter, label: string }[] = [
    { key: 'any', label: 'Any time' },
    { key: 'day', label: 'Past 24 hours' },
    { key: 'week', label: 'Past week' },
    { key: 'month', label: 'Past month' },
    { key: 'year', label: 'Past year' },
];

const formatFilterLabel = (filter: DateFilter): string => {
  if (typeof filter === 'string') {
    const option = filterOptions.find(opt => opt.key === filter);
    return option?.label || 'Any time';
  }
  const { startDate, endDate } = filter;
  if (startDate && endDate) return `${startDate} to ${endDate}`;
  if (startDate) return `From ${startDate}`;
  if (endDate) return `To ${endDate}`;
  return 'Custom range';
};

const ChatInput: React.FC<ChatInputProps> = ({ 
    onSendMessage, 
    isLoading, 
    activeFilter, 
    onFilterChange,
    isFilterMenuOpen,
    onToggleFilterMenu,
    onCloseFilterMenu,
    placeholder,
    isDeepResearch,
    onToggleDeepResearch,
}) => {
  const [text, setText] = useState('');
  const [cursorPosition, setCursorPosition] = useState<{start: number, end: number} | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Set cursor position after formatting
  useEffect(() => {
    if (cursorPosition && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(cursorPosition.start, cursorPosition.end);
        setCursorPosition(null); // Reset after applying
    }
  }, [cursorPosition]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim()) {
      onSendMessage(text);
      setText('');
    }
  };

  const applyFormatting = (format: 'bold' | 'italic' | 'code-block') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);

    let prefix = '';
    let suffix = '';

    switch (format) {
      case 'bold':
        prefix = '**';
        suffix = '**';
        break;
      case 'italic':
        prefix = '*';
        suffix = '*';
        break;
      case 'code-block':
        const prefixNewline = (start > 0 && text[start - 1] !== '\n') ? '\n' : '';
        prefix = `${prefixNewline}\`\`\`\n`;
        suffix = '\n```';
        break;
    }

    const newText = `${text.substring(0, start)}${prefix}${selectedText}${suffix}${text.substring(end)}`;
    setText(newText);
    
    setCursorPosition({
        start: selectedText ? start + prefix.length : start + prefix.length,
        end: selectedText ? end + prefix.length : start + prefix.length,
    });
  };

  const handleVoiceInputClick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let currentTranscript = text;

    recognition.onstart = () => {
      setIsListening(true);
      if (currentTranscript && !currentTranscript.endsWith(' ')) {
        currentTranscript += ' ';
      }
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscriptPiece = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptPiece += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }

      if (finalTranscriptPiece) {
        currentTranscript += finalTranscriptPiece;
      }
      
      setText(currentTranscript + interimTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      textareaRef.current?.focus();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech Recognition Error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        alert("Microphone access is required for voice input. Please enable it in your browser settings.");
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
      return;
    }

    if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
            case 'b':
                e.preventDefault();
                applyFormatting('bold');
                break;
            case 'i':
                e.preventDefault();
                applyFormatting('italic');
                break;
            case 'e':
                e.preventDefault();
                applyFormatting('code-block');
                break;
        }
    }
  };

  const handleCloseFilterMenu = useCallback(() => {
    onCloseFilterMenu();
    filterButtonRef.current?.focus();
  }, [onCloseFilterMenu]);

  // Effect to close filter menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!isFilterMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target as Node) &&
        !filterButtonRef.current?.contains(event.target as Node)
      ) {
        handleCloseFilterMenu();
      }
    };
    
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            handleCloseFilterMenu();
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFilterMenuOpen, handleCloseFilterMenu]);

  const isFilterActive = !(typeof activeFilter === 'string' && activeFilter === 'any');

  return (
    <div className="relative">
      {isFilterMenuOpen && (
        <div ref={filterMenuRef}>
            <FilterPanel 
                activeFilter={activeFilter}
                onApplyFilter={(newFilter) => {
                    onFilterChange(newFilter);
                    handleCloseFilterMenu();
                }}
                onClose={handleCloseFilterMenu}
            />
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {isFilterActive && (
          <div className="flex items-center space-x-2 text-xs bg-[var(--bg-secondary)] border-x border-t border-[var(--border-color)] px-3 py-1.5 rounded-t-lg w-full">
            <FilterIcon className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0" />
            <span className="text-[var(--text-secondary)] font-medium truncate" title={formatFilterLabel(activeFilter)}>
              {formatFilterLabel(activeFilter)}
            </span>
            <button 
              type="button" 
              onClick={() => onFilterChange('any')} 
              className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label="Clear filter"
              title="Clear filter"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className={`bg-[var(--bg-secondary)] border border-[var(--border-color)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)] transition-shadow duration-200 overflow-hidden ${
          isFilterActive ? 'rounded-b-lg' : 'rounded-lg'
        }`}>
            <div className="flex items-center space-x-1 p-2 border-b border-[var(--border-color)]">
                <button type="button" onClick={() => applyFormatting('bold')} className="p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]/80 hover:text-[var(--text-primary)] transition-colors" aria-label="Bold (Ctrl+B)" title="Bold (Ctrl+B)">
                    <BoldIcon className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => applyFormatting('italic')} className="p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]/80 hover:text-[var(--text-primary)] transition-colors" aria-label="Italic (Ctrl+I)" title="Italic (Ctrl+I)">
                    <ItalicIcon className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => applyFormatting('code-block')} className="p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]/80 hover:text-[var(--text-primary)] transition-colors" aria-label="Code Block (Ctrl+E)" title="Code Block (Ctrl+E)">
                    <CodeIcon className="w-4 h-4" />
                </button>
            </div>
            <textarea
                ref={textareaRef}
                rows={2}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder || "Ask me anything..."}
                className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none px-3 py-3 text-sm sm:text-base resize-y overflow-y-auto"
                disabled={isLoading}
                style={{ minHeight: '5rem', maxHeight: '40vh' }}
            />
            <div className="flex items-center justify-between px-2 pb-2">
                 <div></div> {/* Spacer */}
                <div className="flex items-center space-x-1">
                    <button
                        type="button"
                        onClick={onToggleDeepResearch}
                        aria-pressed={isDeepResearch}
                        aria-label={isDeepResearch ? "Disable Deep Research mode" : "Enable Deep Research mode"}
                        title={isDeepResearch ? "Deep Research is active" : "Enable Deep Research for more comprehensive answers"}
                        className={`p-2 rounded-md hover:bg-[var(--bg-tertiary)]/80 transition-colors duration-200 ${
                            isDeepResearch ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                        }`}
                    >
                        <SparklesIcon className="w-5 h-5" />
                    </button>
                    <button
                    ref={filterButtonRef}
                    type="button"
                    onClick={onToggleFilterMenu}
                    aria-expanded={isFilterMenuOpen}
                    aria-controls="filter-menu"
                    aria-label="Open search filters (F)"
                    title="Open search filters (F)"
                    className={`p-2 rounded-md hover:bg-[var(--bg-tertiary)]/80 transition-colors duration-200 ${
                        isFilterActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                    }`}
                    >
                    <FilterIcon className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={handleVoiceInputClick}
                        disabled={isLoading}
                        aria-label={isListening ? "Stop dictation" : "Start dictation"}
                        title={isListening ? "Stop dictation" : "Start dictation"}
                        className={`p-2 rounded-md hover:bg-[var(--bg-tertiary)]/80 transition-colors duration-200 ${
                            isListening
                                ? 'text-[var(--accent-danger)] animate-pulse-icon'
                                : 'text-[var(--text-muted)]'
                        }`}
                    >
                        <MicrophoneIcon className="w-5 h-5" />
                    </button>
                    <button
                    type="submit"
                    disabled={isLoading || !text.trim()}
                    className="p-2 rounded-md bg-[var(--accent-primary)] text-white hover:opacity-90 disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                    aria-label="Send message (Enter)"
                    title="Send message (Enter)"
                    >
                    <SendIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;