// FIX: Added 'useCallback' to the import from 'react' to resolve the 'Cannot find name' error.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SendIcon, FilterIcon, XIcon, BoldIcon, ItalicIcon, CodeIcon, SparklesIcon, MicrophoneIcon, EyeIcon, SparklesIconFilled, PaperclipIcon, FileTextIcon, ErrorIcon } from './Icons';
import { DateFilter, PredefinedDateFilter, AttachedFile, ResearchScope } from '../types';
import FilterPanel from './FilterPanel';
import CodeBlock from './CodeBlock'; // Import the shared CodeBlock component
import DeepResearchPanel from './DeepResearchPanel';
import { useTranslation } from '../hooks/useTranslation';

interface ChatInputProps {
  onSendMessage: (text: string, file?: AttachedFile | null) => void;
  isLoading: boolean;
  activeFilter: DateFilter;
  onFilterChange: (filter: DateFilter) => void;
  isFilterMenuOpen: boolean;
  onToggleFilterMenu: () => void;
  onCloseFilterMenu: () => void;
  placeholder?: string;
  researchScope: ResearchScope | null;
  onSetResearchScope: (scope: ResearchScope | null) => void;
  attachedFile: AttachedFile | null;
  onSetAttachedFile: (file: AttachedFile | null) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
    onSendMessage, 
    isLoading, 
    activeFilter, 
    onFilterChange,
    isFilterMenuOpen,
    onToggleFilterMenu,
    onCloseFilterMenu,
    placeholder,
    researchScope,
    onSetResearchScope,
    attachedFile,
    onSetAttachedFile,
}) => {
  const [text, setText] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [cursorPosition, setCursorPosition] = useState<{start: number, end: number} | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isResearchPanelOpen, setIsResearchPanelOpen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const researchPanelRef = useRef<HTMLDivElement>(null);
  const researchButtonRef = useRef<HTMLButtonElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, locale } = useTranslation();


  const formatFilterLabel = (filter: DateFilter): string => {
    if (typeof filter === 'string') {
        // FIX: The explicit type `Record<PredefinedDateFilter, string>` was too wide, causing `keyMap[filter]` to be `string`.
        // Using `as const` lets TypeScript infer the narrowest possible type for the values (e.g., 'anyTime' instead of string),
        // which matches the expected `TranslationKey` type for the `t` function.
        const keyMap = {
            'any': 'anyTime',
            'day': 'pastDay',
            'week': 'pastWeek',
            'month': 'pastMonth',
            'year': 'pastYear',
        } as const;
        return t(keyMap[filter]);
    }
    
    const { startDate, endDate } = filter;
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const formatter = new Intl.DateTimeFormat(locale, options);

    const formattedStart = startDate ? formatter.format(new Date(startDate)) : null;
    const formattedEnd = endDate ? formatter.format(new Date(endDate)) : null;

    if (formattedStart && formattedEnd) return t('dateRange', { startDate: formattedStart, endDate: formattedEnd });
    if (formattedStart) return t('dateRangeFrom', { startDate: formattedStart });
    if (formattedEnd) return t('dateRangeTo', { endDate: formattedEnd });
    return t('customDateRange');
  };

  // Set cursor position after formatting
  useEffect(() => {
    if (cursorPosition && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(cursorPosition.start, cursorPosition.end);
        setCursorPosition(null); // Reset after applying
    }
  }, [cursorPosition]);

  useEffect(() => {
    // When switching to the write tab, focus the textarea
    if (activeTab === 'write' && textareaRef.current) {
        textareaRef.current.focus();
    }
  }, [activeTab]);


  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim() || attachedFile) {
      onSendMessage(text, attachedFile);
      setText('');
      setFileError(null);
      // Attached file and research scope are cleared in App.tsx
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      setFileError(null); // Clear previous errors on a new attempt.

      if (!file) {
          return; // User cancelled file selection.
      }
      
      onSetAttachedFile(null); // Clear any existing valid file to process the new one.

      const MAX_FILE_SIZE_MB = 5;
      const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
      const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      const SUPPORTED_TEXT_TYPES = ['text/plain', 'text/markdown', 'text/csv', 'application/json'];
      const SUPPORTED_TYPES = [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_TEXT_TYPES];
  
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFileError(`File is too large. Please select a file smaller than ${MAX_FILE_SIZE_MB}MB.`);
        if (event.target) event.target.value = ''; // Reset the input to allow re-selection
        return;
      }
  
      if (!SUPPORTED_TYPES.includes(file.type)) {
          setFileError("Unsupported file type. Please use a supported image or text file.");
          if (event.target) event.target.value = ''; // Reset the input
          return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const base64 = dataUrl.split(',')[1];
        onSetAttachedFile({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
          base64,
        });
      };
      reader.readAsDataURL(file);
  
      if (event.target) {
        event.target.value = ''; // Reset for the success case too.
      }
  };
  
  const handleRemoveFile = () => {
      onSetAttachedFile(null);
      setFileError(null);
  };


  const applyFormatting = (format: 'bold' | 'italic' | 'code' | 'code-block') => {
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
      case 'code':
        prefix = '`';
        suffix = '`';
        break;
      case 'code-block':
        const prefixNewline = (start > 0 && text[start - 1] !== '\n') ? '\n' : '';
        prefix = `${prefixNewline}\`\`\`\n`;
        suffix = '\n```';
        break;
    }
    
    // If there's a selection, wrap it
    if (selectedText) {
        const newText = `${text.substring(0, start)}${prefix}${selectedText}${suffix}${text.substring(end)}`;
        setText(newText);
        setCursorPosition({
            start: start + prefix.length,
            end: end + prefix.length,
        });
    } else { // If no selection, insert the pair and place cursor in middle
        const newText = `${text.substring(0, start)}${prefix}${suffix}${text.substring(end)}`;
        setText(newText);
        setCursorPosition({
            start: start + prefix.length,
            end: start + prefix.length,
        });
    }
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
    recognition.lang = locale;

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
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;

    // Send on Enter (not Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
      return;
    }

    // Smart auto-completion and formatting
    
    // Auto-continue lists
    if (e.key === 'Enter') {
        const currentLine = value.substring(0, selectionStart).split('\n').pop() || '';
        const listMatch = /^\s*([-*+]|\d+\.)\s+/.exec(currentLine);
        if (listMatch) {
            e.preventDefault();
            let newText = '';
            // If the list item is empty, remove it and de-indent
            if (currentLine.trim() === listMatch[0].trim()) {
                newText = value.substring(0, selectionStart - currentLine.length) + value.substring(selectionStart);
                setCursorPosition({ start: selectionStart - currentLine.length, end: selectionStart - currentLine.length });
            } else {
                let nextMarker = listMatch[1];
                if (/\d+\./.test(nextMarker)) {
                    const nextNumber = parseInt(nextMarker, 10) + 1;
                    nextMarker = `${nextNumber}.`;
                }
                const newListItem = `\n${listMatch[0].replace(listMatch[1], nextMarker)} `;
                newText = `${value.substring(0, selectionStart)}${newListItem}${value.substring(selectionEnd)}`;
                setCursorPosition({ start: selectionStart + newListItem.length, end: selectionStart + newListItem.length });
            }
            setText(newText);
            return;
        }
    }

    const pairs: { [key: string]: string } = { '(': ')', '[': ']', '{': '}', "'": "'", '"': '"', '`': '`', '*': '*', '_': '_' };

    if (pairs[e.key]) {
        e.preventDefault();
        const opening = e.key;
        const closing = pairs[opening];
        const selectedText = value.substring(selectionStart, selectionEnd);
        let newText;
        let newCursorPos;

        if (selectedText) {
            newText = `${value.substring(0, selectionStart)}${opening}${selectedText}${closing}${value.substring(selectionEnd)}`;
            newCursorPos = { start: selectionStart + opening.length, end: selectionEnd + opening.length };
        } else {
            newText = `${value.substring(0, selectionStart)}${opening}${closing}${value.substring(selectionEnd)}`;
            newCursorPos = { start: selectionStart + opening.length, end: selectionStart + opening.length };
        }
        setText(newText);
        setCursorPosition(newCursorPos);
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
                applyFormatting('code');
                break;
        }
    }
  };

  const handleCloseFilterMenu = useCallback(() => {
    onCloseFilterMenu();
    filterButtonRef.current?.focus();
  }, [onCloseFilterMenu]);

  // Effect to close pop-up menus when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close Filter Panel
      if (isFilterMenuOpen && filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node) && !filterButtonRef.current?.contains(event.target as Node)) {
        handleCloseFilterMenu();
      }
      // Close Research Panel
      if (isResearchPanelOpen && researchPanelRef.current && !researchPanelRef.current.contains(event.target as Node) && !researchButtonRef.current?.contains(event.target as Node)) {
        setIsResearchPanelOpen(false);
      }
    };
    
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            if (isFilterMenuOpen) handleCloseFilterMenu();
            if (isResearchPanelOpen) setIsResearchPanelOpen(false);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFilterMenuOpen, isResearchPanelOpen, handleCloseFilterMenu]);


  const isFilterActive = !(typeof activeFilter === 'string' && activeFilter === 'any');
  const isDeepResearchActive = researchScope !== null;
  const deepResearchTooltip = "Engage Gemini 2.5 Pro with a specific research goal for more tailored, in-depth analysis.";

  return (
    <div className="relative">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,text/plain,text/markdown,text/csv,application/json" />
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
      {isResearchPanelOpen && (
        <div ref={researchPanelRef}>
            <DeepResearchPanel
                currentScope={researchScope}
                onSelect={(scope) => {
                    onSetResearchScope(scope);
                    setIsResearchPanelOpen(false);
                }}
                onClear={() => {
                    onSetResearchScope(null);
                    setIsResearchPanelOpen(false);
                }}
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
             {fileError && (
                <div className="bg-[var(--accent-danger)]/10 border-b border-[var(--accent-danger)]/30 px-3 py-2 flex items-center justify-between text-sm animate-fade-in">
                    <div className="flex items-center space-x-2 text-[var(--accent-danger)]">
                        <ErrorIcon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{fileError}</span>
                    </div>
                    <button type="button" onClick={() => setFileError(null)} className="p-1 rounded-full text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/20 transition-colors" aria-label="Dismiss file error">
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
             )}
             {attachedFile && (
                <div className="bg-[var(--bg-tertiary)]/30 border-b border-[var(--border-color)] px-3 py-2 flex items-center justify-between animate-fade-in">
                    <div className="flex items-center space-x-2 overflow-hidden">
                        {attachedFile.type.startsWith('image/') ? (
                            <img src={attachedFile.dataUrl} alt={attachedFile.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        ) : (
                            <div className="w-8 h-8 flex items-center justify-center bg-[var(--bg-primary)] rounded flex-shrink-0">
                                <FileTextIcon className="w-5 h-5 text-[var(--text-muted)]" />
                            </div>
                        )}
                        <div className="text-sm overflow-hidden">
                            <p className="font-medium text-[var(--text-primary)] truncate">{attachedFile.name}</p>
                            <p className="text-xs text-[var(--text-muted)]">{Math.round(attachedFile.size / 1024)} KB</p>
                        </div>
                    </div>
                    <button type="button" onClick={handleRemoveFile} className="p-1 rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] flex-shrink-0 ml-2" aria-label="Remove attached file">
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
            <div className="flex items-center justify-between p-2 border-b border-[var(--border-color)]">
                <div className="flex items-center space-x-1">
                    <button type="button" onClick={() => setActiveTab('write')} className={`px-3 py-1 text-sm rounded-md transition-colors ${activeTab === 'write' ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]/60'}`}>
                        Write
                    </button>
                    <button type="button" onClick={() => setActiveTab('preview')} className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center space-x-1.5 ${activeTab === 'preview' ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]/60'}`}>
                        <EyeIcon className="w-4 h-4" />
                        <span>Preview</span>
                    </button>
                </div>
                <div className="flex items-center space-x-1">
                    <button type="button" onClick={() => applyFormatting('bold')} className="p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]/80 hover:text-[var(--text-primary)] transition-colors" aria-label="Bold (Ctrl+B)" title="Bold (Ctrl+B)">
                        <BoldIcon className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => applyFormatting('italic')} className="p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]/80 hover:text-[var(--text-primary)] transition-colors" aria-label="Italic (Ctrl+I)" title="Italic (Ctrl+I)">
                        <ItalicIcon className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => applyFormatting('code')} className="p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]/80 hover:text-[var(--text-primary)] transition-colors" aria-label="Inline Code (Ctrl+E)" title="Inline Code (Ctrl+E)">
                        <CodeIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            {activeTab === 'write' ? (
                <textarea
                    ref={textareaRef}
                    rows={4}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || "Ask me anything, or attach an image or text file... (Markdown supported)"}
                    className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none px-3 py-3 text-sm sm:text-base resize-y overflow-y-auto"
                    disabled={isLoading}
                    style={{ minHeight: '8rem', maxHeight: '40vh' }}
                />
            ) : (
                <div className="prose prose-themed max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 p-3 bg-[var(--bg-primary)] overflow-y-auto" style={{ minHeight: '8rem', maxHeight: '40vh' }}>
                    {text.trim() ? (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{ code: CodeBlock }}
                        >
                            {text}
                        </ReactMarkdown>
                    ) : (
                        <p className="text-[var(--text-muted)] italic">Preview will appear here...</p>
                    )}
                </div>
            )}
            
            <div className="flex items-center justify-between px-2 pb-2">
                 <div className="flex items-center space-x-1">
                    <button
                        type="button"
                        onClick={handleFileSelect}
                        disabled={isLoading}
                        aria-label="Attach file"
                        title="Attach file"
                        className="p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]/80 hover:text-[var(--text-primary)] transition-colors"
                    >
                        <PaperclipIcon className="w-5 h-5" />
                    </button>
                 </div>
                <div className="flex items-center space-x-1">
                    <button
                        ref={researchButtonRef}
                        type="button"
                        onClick={() => setIsResearchPanelOpen(p => !p)}
                        aria-pressed={isDeepResearchActive}
                        aria-label={isDeepResearchActive ? "Deep Research mode is active" : "Enable Deep Research mode"}
                        title={isDeepResearchActive ? "Deep Research is active" : deepResearchTooltip}
                        className={`p-2 rounded-md transition-all duration-200 ${
                            isDeepResearchActive 
                                ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/30' 
                                : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]/80'
                        }`}
                    >
                        {isDeepResearchActive ? <SparklesIconFilled className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
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
                    disabled={isLoading || (!text.trim() && !attachedFile)}
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