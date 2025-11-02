import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getGeminiResponseStream, getSuggestedPrompts, getConversationSummary, parseGeminiError, getRelatedTopics, generateImage, generateVideo } from './services/geminiService';
import { playSendSound, playReceiveSound } from './services/audioService';
import { ChatMessage as ChatMessageType, DateFilter, ModelId, Task } from './types';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { BotIcon, SearchIcon, TrashIcon, ClipboardListIcon, CheckIcon, SparklesIcon, XIcon, CopyIcon, ImageIcon, VideoIcon, DownloadIcon, PaletteIcon, HelpCircleIcon, SettingsIcon, KeyIcon, ChevronRightIcon, FileCodeIcon, LightbulbIcon, CheckSquareIcon, PlusSquareIcon, InfoIcon } from './components/Icons';
import ApiKeySelector from './components/ApiKeySelector';
import Lightbox from './components/Lightbox';
import ErrorBoundary from './components/ErrorBoundary';
import ThemeSelector from './components/ThemeSelector';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import ModelSelector from './components/ModelSelector';
import ApiKeyManager from './components/ApiKeyManager';
import CustomCssModal from './components/CustomCssModal';
import ModelExplanationTooltip from './components/ModelExplanationTooltip';
import TodoListModal from './components/TodoListModal';
import AboutModal from './components/AboutModal';
import RecentQueries from './components/RecentQueries';
import SuggestedPrompts from './components/SuggestedPrompts';
import RelatedTopics from './components/RelatedTopics';

const initialMessages: ChatMessageType[] = [
  {
    role: 'model',
    text: "Hello! I'm a conversational search assistant. Ask me anything, or try `/imagine <prompt>` to create an image, or `/create-video <prompt>` for a short video.",
    sources: []
  }
];

const examplePrompts = [
    "What are the latest advancements in AI?",
    "/imagine a photorealistic image of a cat astronaut",
    "/create-video a drone flying over a futuristic city",
];

const CHAT_HISTORY_KEY = 'chatHistory';
const MODEL_STORAGE_KEY = 'chat-model';
const CUSTOM_CSS_KEY = 'custom-user-css';
const TODO_LIST_KEY = 'todo-list-tasks';
const AUTHORITATIVE_SOURCES_KEY = 'prioritize-authoritative-sources';
const RECENT_QUERIES_KEY = 'recent-search-queries';

const imageLoadingTexts = [
  "Painting with pixels...",
  "Summoning creativity...",
  "Composing your masterpiece...",
  "Reticulating splines...",
  "Asking the digital muse for inspiration...",
];

const videoLoadingTexts = [
    "Directing your short film...",
    "Warming up the virtual cameras...",
    "Rendering the first scene...",
    "Applying special effects...",
    "Finalizing the cut...",
];

interface ModelExplanationState {
    isVisible: boolean;
    modelId: ModelId | null;
}

interface PlaceholderLoaderProps {
    type: 'image' | 'video';
    prompt?: string | null;
}

// Custom hook to handle clicks outside a specified element
function useOnClickOutside(ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent | TouchEvent) => void) {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler(event);
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
}

const PlaceholderLoader: React.FC<PlaceholderLoaderProps> = ({ type, prompt }) => {
    const loadingTexts = type === 'image' ? imageLoadingTexts : videoLoadingTexts;
    const [currentText, setCurrentText] = useState(loadingTexts[0]);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        const textIntervalId = setInterval(() => {
            setCurrentText(prevText => {
                const currentIndex = loadingTexts.indexOf(prevText);
                const nextIndex = (currentIndex + 1) % loadingTexts.length;
                return loadingTexts[nextIndex];
            });
        }, 2500);

        const timerId = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);

        return () => {
            clearInterval(textIntervalId);
            clearInterval(timerId);
        };
    }, [loadingTexts]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const Icon = type === 'image' ? ImageIcon : VideoIcon;

    return (
        <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 my-2 animate-fade-in">
             <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-[var(--bg-accent-translucent)]">
                <BotIcon className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div className="flex-1 group relative pt-1">
                <div className="w-full max-w-sm aspect-video bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] flex flex-col items-center justify-center p-4 animate-shimmer" role="status" aria-live="polite">
                    <Icon className="w-10 h-10 text-[var(--text-muted)] mb-3" />
                    {type === 'image' && prompt && (
                         <p className="text-sm font-medium text-[var(--text-secondary)] text-center px-4 italic truncate" title={prompt}>
                            "{prompt}"
                         </p>
                    )}
                    {type === 'image' && (
                        <p className="text-xs font-mono text-[var(--text-muted)] mt-2">{formatTime(elapsedSeconds)}</p>
                    )}
                    <p className="text-sm text-[var(--text-muted)] text-center px-4 mt-3">{currentText}</p>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>(() => {
    try {
      const savedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          return parsedMessages;
        }
      }
    } catch (error) {
      console.error("Failed to load chat history from localStorage:", error);
      localStorage.removeItem(CHAT_HISTORY_KEY);
    }
    return initialMessages;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
        const savedTasks = localStorage.getItem(TODO_LIST_KEY);
        return savedTasks ? JSON.parse(savedTasks) : [];
    } catch (error) {
        console.error("Failed to load tasks from localStorage:", error);
        return [];
    }
  });
  
  const [recentQueries, setRecentQueries] = useState<string[]>(() => {
    try {
        const savedQueries = localStorage.getItem(RECENT_QUERIES_KEY);
        return savedQueries ? JSON.parse(savedQueries) : [];
    } catch (error) {
        console.error("Failed to load recent queries from localStorage:", error);
        return [];
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [currentImagePrompt, setCurrentImagePrompt] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [isAllCopied, setIsAllCopied] = useState<boolean>(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [relatedTopics, setRelatedTopics] = useState<string[]>([]);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [isSummaryCopied, setIsSummaryCopied] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('any');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false);
  const [isKeySelected, setIsKeySelected] = useState<boolean>(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [model, setModel] = useState<ModelId>(() => {
    try {
        const savedModel = localStorage.getItem(MODEL_STORAGE_KEY) as ModelId;
        if (savedModel && (savedModel === 'gemini-2.5-flash' || savedModel === 'gemini-2.5-pro')) {
            return savedModel;
        }
    } catch (error) {
        console.error("Failed to load model from localStorage:", error);
    }
    return 'gemini-2.5-flash'; // Default model
  });
  const [isApiKeyManagerOpen, setIsApiKeyManagerOpen] = useState(false);
  const [isDeepResearch, setIsDeepResearch] = useState<boolean>(false);
  const [customCss, setCustomCss] = useState<string>('');
  const [isCustomCssModalOpen, setIsCustomCssModalOpen] = useState<boolean>(false);
  const [modelExplanation, setModelExplanation] = useState<ModelExplanationState>({ isVisible: false, modelId: null });
  const [isTodoListModalOpen, setIsTodoListModalOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [prioritizeAuthoritative, setPrioritizeAuthoritative] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTHORITATIVE_SOURCES_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch (error) {
      console.error("Failed to load authoritative sources preference from localStorage:", error);
      return false;
    }
  });
  const [showApiKeySelector, setShowApiKeySelector] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  
  useOnClickOutside(settingsMenuRef, () => {
      if (isSettingsMenuOpen) {
          setIsSettingsMenuOpen(false);
          setOpenSubMenu(null);
      }
  });

  useEffect(() => {
    // Check for API key on initial load for video features
    window.aistudio?.hasSelectedApiKey().then(setIsKeySelected).catch(console.error);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isGeneratingImage, isGeneratingVideo, suggestedPrompts, relatedTopics]);

  useEffect(() => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
  }, [messages]);
  
  useEffect(() => {
    localStorage.setItem(RECENT_QUERIES_KEY, JSON.stringify(recentQueries));
  }, [recentQueries]);

  useEffect(() => {
    localStorage.setItem(TODO_LIST_KEY, JSON.stringify(tasks));
  }, [tasks]);
  
  useEffect(() => {
    localStorage.setItem(MODEL_STORAGE_KEY, model);
    if (messages.length > 1) { // Don't show on first load
      setModelExplanation({ isVisible: true, modelId: model });
      const timer = setTimeout(() => setModelExplanation({ isVisible: false, modelId: model }), 5000);
      return () => clearTimeout(timer);
    }
  }, [model]);

  useEffect(() => {
    localStorage.setItem(AUTHORITATIVE_SOURCES_KEY, JSON.stringify(prioritizeAuthoritative));
  }, [prioritizeAuthoritative]);
  
  useEffect(() => {
    try {
      const savedCss = localStorage.getItem(CUSTOM_CSS_KEY) || '';
      setCustomCss(savedCss);
      const styleElement = document.getElementById('custom-user-styles') || document.createElement('style');
      styleElement.id = 'custom-user-styles';
      styleElement.innerHTML = savedCss;
      document.head.appendChild(styleElement);
    } catch (error) {
      console.error("Failed to load or apply custom CSS:", error);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open shortcuts modal with '?'
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal(true);
      }
      // Clear chat with Ctrl/Cmd + K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleClearChat();
      }
      // Toggle filter menu with 'f'
      if (e.key === 'f' && e.target instanceof HTMLElement && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault();
        setIsFilterMenuOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  // --- Handlers ---
  const addRecentQuery = (query: string) => {
    setRecentQueries(prev => {
        const lowerCaseQuery = query.toLowerCase().trim();
        const newQueries = prev.filter(q => q.toLowerCase().trim() !== lowerCaseQuery);
        return [query, ...newQueries].slice(0, 5); // Keep last 5
    });
  };

  const handleSendMessage = async (prompt: string) => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return;

    const isImageCommand = trimmedPrompt.startsWith('/imagine ');
    const isVideoCommand = trimmedPrompt.startsWith('/create-video ');
    const userMessage: ChatMessageType = { role: 'user', text: trimmedPrompt };

    // Common state updates
    setSuggestedPrompts([]);
    setRelatedTopics([]);
    playSendSound();

    // IMAGE COMMAND LOGIC
    if (isImageCommand) {
        setMessages(prev => [...prev, userMessage]); // Add user message to UI
        const imagePrompt = trimmedPrompt.substring(8).trim();
        if (!imagePrompt) {
            setMessages(prev => [...prev, { role: 'model', text: "Please provide a prompt after `/imagine`.", isError: true }]);
            return;
        }
        setIsGeneratingImage(true);
        setCurrentImagePrompt(imagePrompt);
        try {
            const imageUrl = await generateImage(imagePrompt);
            setMessages(prev => [...prev, { role: 'model', text: imagePrompt, imageUrl }]);
        } catch (error) {
            const parsedError = parseGeminiError(error);
            setMessages(prev => [...prev, { role: 'model', text: parsedError.message, isError: true, originalText: trimmedPrompt }]);
        } finally {
            setIsGeneratingImage(false);
            setCurrentImagePrompt(null);
        }
        return; // End execution for image command
    }

    // VIDEO COMMAND LOGIC
    if (isVideoCommand) {
        setMessages(prev => [...prev, userMessage]); // Add user message to UI
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeySelected(hasKey);
        if (!hasKey) {
            setMessages(prev => prev.slice(0, -1)); // Remove user message if key is needed
            setShowApiKeySelector(true);
            return;
        }
        const videoPrompt = trimmedPrompt.substring(14).trim();
        if (!videoPrompt) {
            setMessages(prev => [...prev, { role: 'model', text: "Please provide a prompt after `/create-video`.", isError: true }]);
            return;
        }
        setIsGeneratingVideo(true);
        try {
            const videoUrl = await generateVideo(videoPrompt);
            setMessages(prev => [...prev, { role: 'model', text: videoPrompt, videoUrl }]);
        } catch (error) {
            const parsedError = parseGeminiError(error);
            if (parsedError.type === 'api_key' || parsedError.type === 'permission') {
                setShowApiKeySelector(true);
            }
            setMessages(prev => [...prev, { role: 'model', text: parsedError.message, isError: true, originalText: trimmedPrompt }]);
        } finally {
            setIsGeneratingVideo(false);
        }
        return; // End execution for video command
    }

    // STANDARD TEXT COMMAND LOGIC
    setIsLoading(true);
    addRecentQuery(trimmedPrompt);

    // Create the history for the API call. It's the current state + the new message.
    const historyForApi = [...messages, userMessage];

    // Update the UI state with both the user message and the thinking indicator in one go.
    setMessages(prev => [...prev, userMessage, { role: 'model', text: '', isThinking: true }]);

    let currentResponse = '';
    try {
        const { sources } = await getGeminiResponseStream(
            historyForApi, // Use the correct, up-to-date history
            dateFilter,
            (textChunk) => {
                currentResponse += textChunk;
                setMessages(prev => prev.map((msg, index) =>
                    index === prev.length - 1 ? { ...msg, text: currentResponse, isThinking: false } : msg
                ));
            },
            model,
            isDeepResearch,
            prioritizeAuthoritative
        );

        playReceiveSound();
        setMessages(prev => prev.map((msg, index) =>
            index === prev.length - 1 ? { ...msg, sources } : msg
        ));

        // Fetch suggested prompts and related topics after response is complete
        getSuggestedPrompts(trimmedPrompt, currentResponse, model).then(setSuggestedPrompts);
        getRelatedTopics(trimmedPrompt, currentResponse, model).then(setRelatedTopics);

    } catch (error) {
        const parsedError = parseGeminiError(error);
        setMessages(prev => prev.map((msg, index) =>
            index === prev.length - 1 ? { role: 'model', text: parsedError.message, isError: true, originalText: trimmedPrompt } : msg
        ));
    } finally {
        setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages(initialMessages);
    setSuggestedPrompts([]);
    setRelatedTopics([]);
    setSummaryText(null);
  };
  
  const handleCopyAll = () => {
    const conversationText = messages
      .map(m => `${m.role === 'user' ? 'You' : 'Assistant'}:\n${m.text}`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(conversationText).then(() => {
      setIsAllCopied(true);
      setTimeout(() => setIsAllCopied(false), 2000);
    });
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setShowSummaryModal(true);
    try {
        const summary = await getConversationSummary(messages, model);
        setSummaryText(summary);
    } catch (error) {
        const parsedError = parseGeminiError(error);
        setSummaryText(`Error generating summary: ${parsedError.message}`);
    } finally {
        setIsSummarizing(false);
    }
  };
  
  const handleFeedback = (index: number, feedback: 'up' | 'down') => {
    setMessages(prev => prev.map((msg, i) => i === index ? { ...msg, feedback: msg.feedback === feedback ? undefined : feedback } : msg));
  };

  const handleRetry = (prompt: string) => {
    // Remove the error message before retrying
    setMessages(prev => prev.filter(msg => msg.originalText !== prompt));
    handleSendMessage(prompt);
  };

  const handleSaveCss = (css: string) => {
    setCustomCss(css);
    try {
      localStorage.setItem(CUSTOM_CSS_KEY, css);
      const styleElement = document.getElementById('custom-user-styles') as HTMLStyleElement;
      styleElement.innerHTML = css;
    } catch (error) {
      console.error("Failed to save custom CSS:", error);
    }
    setIsCustomCssModalOpen(false);
  };

  // Task Handlers
  const handleAddTask = (text: string) => {
    const newTask: Task = { id: Date.now().toString(), text, completed: false };
    setTasks(prev => [...prev, newTask]);
  };
  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };
  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const handleKeySelected = () => {
    setShowApiKeySelector(false);
    setIsKeySelected(true);
  };

  const handleChangeApiKey = async () => {
    try {
        await window.aistudio.openSelectKey();
        setIsKeySelected(true);
        setIsApiKeyManagerOpen(false);
    } catch (error) {
        console.error("Error opening key selector:", error);
    }
  };

  const handleClearApiKey = async () => {
    try {
        await window.aistudio.clearSelectedApiKey?.();
        setIsKeySelected(false);
    } catch (error) {
        console.error("Error clearing API key:", error);
    }
  };

  return (
    <>
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
      <main className="flex-1 flex flex-col h-screen">
        <header className="flex items-center justify-between p-3 border-b border-[var(--border-color)] flex-shrink-0">
          <div className="flex items-center space-x-3">
             <BotIcon className="w-7 h-7 text-[var(--accent-primary)]" />
             <h1 className="text-lg font-semibold text-[var(--text-secondary)]">Conversational Search</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={handleCopyAll} title="Copy Conversation" className="p-2 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              {isAllCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
            </button>
            <button onClick={handleSummarize} title="Summarize Conversation" className="p-2 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <ClipboardListIcon className="w-5 h-5" />
            </button>
            <button onClick={handleClearChat} title="Clear Chat (Ctrl+K)" className="p-2 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <TrashIcon className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-[var(--border-color)] mx-1"></div>
            <div className="relative" ref={settingsMenuRef}>
                <button onClick={() => setIsSettingsMenuOpen(p => !p)} title="Settings" className="p-2 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    <SettingsIcon className="w-5 h-5" />
                </button>
                {isSettingsMenuOpen && (
                    <div className="absolute top-full mt-2 right-0 w-64 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl z-30 animate-fade-in p-2"
                        onMouseLeave={() => setOpenSubMenu(null)}>
                        <div className="relative">
                            <button onMouseEnter={() => setOpenSubMenu('theme')} className="w-full text-left flex items-center justify-between p-2 text-sm rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                                <div className="flex items-center space-x-2"><PaletteIcon className="w-4 h-4" /> <span>Theme</span></div>
                                <ChevronRightIcon className="w-4 h-4" />
                            </button>
                            {openSubMenu === 'theme' && <ThemeSelector onClose={() => { setOpenSubMenu(null); setIsSettingsMenuOpen(false); }} />}
                        </div>
                        <div className="relative">
                            <button onMouseEnter={() => setOpenSubMenu('model')} className="w-full text-left flex items-center justify-between p-2 text-sm rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]">
                               <div className="flex items-center space-x-2"><SparklesIcon className="w-4 h-4" /> <span>Model & Settings</span></div>
                               <ChevronRightIcon className="w-4 h-4" />
                            </button>
                            {openSubMenu === 'model' && <ModelSelector currentModel={model} onSetModel={setModel} onClose={() => { setOpenSubMenu(null); setIsSettingsMenuOpen(false); }} prioritizeAuthoritative={prioritizeAuthoritative} onTogglePrioritizeAuthoritative={() => setPrioritizeAuthoritative(p => !p)}/>}
                        </div>
                         <div className="my-1 h-px bg-[var(--border-color)]/50"></div>
                         <button onClick={() => { setIsApiKeyManagerOpen(true); setIsSettingsMenuOpen(false); }} className="w-full text-left flex items-center space-x-2 p-2 text-sm rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"><KeyIcon className="w-4 h-4" /> <span>API Key Manager</span></button>
                         <button onClick={() => { setIsCustomCssModalOpen(true); setIsSettingsMenuOpen(false); }} className="w-full text-left flex items-center space-x-2 p-2 text-sm rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"><FileCodeIcon className="w-4 h-4" /> <span>Custom CSS</span></button>
                         <button onClick={() => { setIsTodoListModalOpen(true); setIsSettingsMenuOpen(false); }} className="w-full text-left flex items-center space-x-2 p-2 text-sm rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"><CheckSquareIcon className="w-4 h-4" /> <span>To-Do List</span></button>
                         <div className="my-1 h-px bg-[var(--border-color)]/50"></div>
                         <button onClick={() => { setShowShortcutsModal(true); setIsSettingsMenuOpen(false); }} className="w-full text-left flex items-center space-x-2 p-2 text-sm rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"><HelpCircleIcon className="w-4 h-4" /> <span>Keyboard Shortcuts</span></button>
                         <button onClick={() => { setIsAboutModalOpen(true); setIsSettingsMenuOpen(false); }} className="w-full text-left flex items-center space-x-2 p-2 text-sm rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"><InfoIcon className="w-4 h-4" /> <span>About</span></button>
                    </div>
                )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto">
                <ErrorBoundary>
                    {messages.map((msg, index) => (
                        <ChatMessage
                        key={index}
                        message={msg}
                        messageIndex={index}
                        onFeedback={handleFeedback}
                        onImageClick={setLightboxImageUrl}
                        onRetry={handleRetry}
                        />
                    ))}
                    {isGeneratingImage && <PlaceholderLoader type="image" prompt={currentImagePrompt} />}
                    {isGeneratingVideo && <PlaceholderLoader type="video" prompt={null} />}
                    
                    {!isLoading && !isGeneratingImage && !isGeneratingVideo && (
                      <>
                        <SuggestedPrompts
                          prompts={suggestedPrompts}
                          onPromptClick={handleSendMessage}
                        />
                        <RelatedTopics
                          topics={relatedTopics}
                          onTopicClick={handleSendMessage}
                        />
                      </>
                    )}
                </ErrorBoundary>
              <div ref={chatEndRef}></div>
            </div>
        </div>

        <div className="p-4 flex-shrink-0 bg-[var(--bg-primary)]">
            <div className="max-w-4xl mx-auto">
              <RecentQueries queries={recentQueries} onQueryClick={handleSendMessage} onClear={() => setRecentQueries([])} />
              <div className="mt-4">
                <ChatInput
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading || isGeneratingImage || isGeneratingVideo}
                    activeFilter={dateFilter}
                    onFilterChange={setDateFilter}
                    isFilterMenuOpen={isFilterMenuOpen}
                    onToggleFilterMenu={() => setIsFilterMenuOpen(prev => !prev)}
                    onCloseFilterMenu={() => setIsFilterMenuOpen(false)}
                    isDeepResearch={isDeepResearch}
                    onToggleDeepResearch={() => setIsDeepResearch(p => !p)}
                />
              </div>
            </div>
        </div>
      </main>
    </div>

    {/* Modals and Overlays */}
    {showApiKeySelector && <ApiKeySelector onKeySelected={handleKeySelected} />}
    {lightboxImageUrl && <Lightbox imageUrl={lightboxImageUrl} onClose={() => setLightboxImageUrl(null)} />}
    {showShortcutsModal && <KeyboardShortcutsModal onClose={() => setShowShortcutsModal(false)} />}
    {isApiKeyManagerOpen && <ApiKeyManager onClose={() => setIsApiKeyManagerOpen(false)} onChangeKey={handleChangeApiKey} onClearKey={handleClearApiKey} isKeySelected={isKeySelected} />}
    {isCustomCssModalOpen && <CustomCssModal onClose={() => setIsCustomCssModalOpen(false)} onSave={handleSaveCss} initialCss={customCss} />}
    <ModelExplanationTooltip modelId={modelExplanation.modelId} isVisible={modelExplanation.isVisible} onClose={() => setModelExplanation({ isVisible: false, modelId: model })}/>
    {isTodoListModalOpen && <TodoListModal onClose={() => setIsTodoListModalOpen(false)} tasks={tasks} onAddTask={handleAddTask} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} />}
    {isAboutModalOpen && <AboutModal onClose={() => setIsAboutModalOpen(false)} />}
    </>
  );
};

export default App;