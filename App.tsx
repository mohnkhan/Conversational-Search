import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    getGeminiResponseStream, 
    getGeminiSuggestedPrompts, 
    getGeminiConversationSummary, 
    parseGeminiError, 
    getGeminiRelatedTopics, 
    generateImageWithImagen, 
    generateVideo,
    getOpenAIResponseStream,
    generateImageWithDallE,
    getOpenAIConversationSummary,
    getOpenAISuggestedPrompts,
    getOpenAIRelatedTopics,
    parseOpenAIError,
    getClaudeResponseStream,
    getClaudeConversationSummary,
    getClaudeSuggestedPrompts,
    getClaudeRelatedTopics,
    parseClaudeError
} from './services/geminiService';
import { playSendSound, playReceiveSound } from './services/audioService';
import { ChatMessage as ChatMessageType, DateFilter, Model, Task, AttachedFile, ResearchScope, ModelProvider, Persona } from './types';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { BotIcon, SearchIcon, TrashIcon, ClipboardListIcon, CheckIcon, SparklesIcon, XIcon, CopyIcon, ImageIcon, VideoIcon, DownloadIcon, PaletteIcon, HelpCircleIcon, SettingsIcon, KeyIcon, ChevronRightIcon, FileCodeIcon, LightbulbIcon, CheckSquareIcon, PlusSquareIcon, InfoIcon, UsersIcon } from './components/Icons';
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
import ExportChatModal from './components/ExportChatModal';
import SummaryModal from './components/SummaryModal';
import InitialPrompts from './components/InitialPrompts';
import PersonaManager from './components/PersonaManager';
import PersonaSelector from './components/PersonaSelector';

// --- Model Definitions ---
export const AVAILABLE_MODELS: Model[] = [
    // Google
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', description: 'Fast and cost-effective for most tasks.' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google', description: 'Most capable for complex reasoning.' },
    // OpenAI
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'The latest, most advanced model from OpenAI.' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', description: 'High-performance model for large-scale tasks.' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', description: 'Fast and optimized for chat applications.' },
    // Anthropic
    { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', provider: 'anthropic', description: 'Anthropic\'s newest, most intelligent model.'},
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', description: 'Highest performance for highly complex tasks.'},
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', description: 'Fastest and most compact for near-instant responses.'}
];

export const DEFAULT_GOOGLE_MODEL = AVAILABLE_MODELS[0];
export const DEFAULT_OPENAI_MODEL = AVAILABLE_MODELS[2];
export const DEFAULT_ANTHROPIC_MODEL = AVAILABLE_MODELS[5];

const defaultPersonas: Persona[] = [
    { id: 'default-1', name: 'Creative Writer', icon: '✍️', prompt: 'You are an acclaimed creative writer. Your responses should be imaginative, evocative, and rich in literary devices. Focus on storytelling and vivid descriptions.' },
    { id: 'default-2', name: 'Technical Expert', icon: '⚙️', prompt: 'You are a senior software engineer and technical expert. Your answers must be accurate, concise, and technically detailed. Use code blocks for examples and explain complex concepts clearly.' },
    { id: 'default-3', name: 'Sarcastic Assistant', icon: '😏', prompt: 'You are a witty and sarcastic assistant. Your responses should be helpful but delivered with a dry, humorous, and slightly cynical tone. Don\'t be afraid to poke fun at the user\'s query, but still provide the correct answer.' },
];

const getInitialMessages = (model: Model): ChatMessageType[] => {
    let text = "Hello! I'm a conversational search assistant. Ask me anything.";
    switch (model.provider) {
        case 'google':
            text = "Hello! I'm a conversational search assistant. Ask me anything, or try `/imagine <prompt>` to create an image, `/create-video <prompt>` for a short video, or `/summarize` to get a summary of our chat.";
            break;
        case 'openai':
            text = "Hello! I'm a conversational assistant powered by OpenAI. Ask me anything, or try `/imagine <prompt>` to create an image or `/summarize` to get a summary of our chat.";
            break;
        case 'anthropic':
            text = "Hello! I'm a conversational assistant powered by Anthropic's Claude. Ask me anything or try `/summarize` to get a summary of our chat. I can also understand images.";
            break;
    }
    return [{ role: 'model', text, sources: [], timestamp: new Date().toISOString() }];
};

const getExamplePrompts = (model: Model) => {
    switch (model.provider) {
        case 'google':
            return ["What are the latest advancements in AI?", "/imagine a photorealistic image of a cat astronaut", "/create-video a drone flying over a futuristic city"];
        case 'openai':
            return ["What is the significance of the GPT-4o model?", "/imagine a vibrant watercolor painting of a fox in a forest", "Write a short story about a robot who discovers music."];
        case 'anthropic':
            return ["What are the core principles of constitutional AI?", "Compare and contrast the architectural styles of Frank Lloyd Wright and Zaha Hadid.", "Write a python script to analyze a CSV file and find the average of a column."];
        default:
            return ["What are the latest advancements in AI?", "Write a short story about a robot who discovers music."];
    }
};

// --- Local Storage Keys ---
const CHAT_HISTORY_KEY = 'chatHistory';
const MODEL_STORAGE_KEY = 'chat-model-v2';
const OPENAI_API_KEY_STORAGE_KEY = 'openai-api-key';
const ANTHROPIC_API_KEY_STORAGE_KEY = 'anthropic-api-key';
const CUSTOM_CSS_KEY = 'custom-user-css';
const TODO_LIST_KEY = 'todo-list-tasks';
const PERSONAS_KEY = 'ai-personas';
const ACTIVE_PERSONA_ID_KEY = 'active-ai-persona-id';
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
    model: Model | null;
}

interface ApiKeySelectorPropsState {
    show: boolean;
    title?: string;
    description?: string;
}

interface PlaceholderLoaderProps {
    type: 'image' | 'video';
    prompt?: string | null;
}

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
    // --- State Initialization ---
    const [model, setModel] = useState<Model>(() => {
      try {
          const savedModel = localStorage.getItem(MODEL_STORAGE_KEY);
          if (savedModel) {
            const parsed = JSON.parse(savedModel);
            const foundModel = AVAILABLE_MODELS.find(m => m.id === parsed.id);
            if (foundModel) return foundModel;
          }
      } catch (error) { console.error("Failed to load model from localStorage:", error); }
      return DEFAULT_GOOGLE_MODEL;
    });

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
    return getInitialMessages(model);
  });

  const [openAIApiKey, setOpenAIApiKey] = useState<string | null>(() => localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY));
  const [anthropicApiKey, setAnthropicApiKey] = useState<string | null>(() => localStorage.getItem(ANTHROPIC_API_KEY_STORAGE_KEY));

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
        const savedTasks = localStorage.getItem(TODO_LIST_KEY);
        return savedTasks ? JSON.parse(savedTasks) : [];
    } catch (error) { console.error("Failed to load tasks from localStorage:", error); return []; }
  });

  const [personas, setPersonas] = useState<Persona[]>(() => {
    try {
        const savedPersonas = localStorage.getItem(PERSONAS_KEY);
        return savedPersonas ? JSON.parse(savedPersonas) : defaultPersonas;
    } catch (error) { console.error("Failed to load personas from localStorage:", error); return defaultPersonas; }
  });
  
  const [activePersona, setActivePersona] = useState<Persona | null>(() => {
      try {
          const savedPersonas = JSON.parse(localStorage.getItem(PERSONAS_KEY) || '[]');
          const activeId = localStorage.getItem(ACTIVE_PERSONA_ID_KEY);
          if (activeId) {
              return savedPersonas.find((p: Persona) => p.id === activeId) || null;
          }
      } catch (error) { console.error("Failed to load active persona:", error); }
      return null;
  });
  
  const [recentQueries, setRecentQueries] = useState<string[]>(() => {
    try {
        const savedQueries = localStorage.getItem(RECENT_QUERIES_KEY);
        return savedQueries ? JSON.parse(savedQueries) : [];
    } catch (error) { console.error("Failed to load recent queries from localStorage:", error); return []; }
  });
  
  const [prioritizeAuthoritative, setPrioritizeAuthoritative] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTHORITATIVE_SOURCES_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch (error) { console.error("Failed to load authoritative sources preference:", error); return false; }
  });
  
  const [customCss, setCustomCss] = useState<string>('');
  
  // --- UI/Interaction State ---
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
  const [dateFilter, setDateFilter] = useState<DateFilter>('any');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState<boolean>(false);
  const [isKeySelected, setIsKeySelected] = useState<boolean>(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const [researchScope, setResearchScope] = useState<ResearchScope | null>(null);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [apiKeySelectorProps, setApiKeySelectorProps] = useState<ApiKeySelectorPropsState>({ show: false });

  // --- Modal & Menu State ---
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [isApiKeyManagerOpen, setIsApiKeyManagerOpen] = useState(false);
  const [isPersonaManagerOpen, setIsPersonaManagerOpen] = useState(false);
  const [isCustomCssModalOpen, setIsCustomCssModalOpen] = useState<boolean>(false);
  const [modelExplanation, setModelExplanation] = useState<ModelExplanationState>({ isVisible: false, model: null });
  const [isTodoListModalOpen, setIsTodoListModalOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  
  useOnClickOutside(settingsMenuRef, () => {
      if (isSettingsMenuOpen) {
          setIsSettingsMenuOpen(false);
          setOpenSubMenu(null);
      }
  });

  useEffect(() => {
    window.aistudio?.hasSelectedApiKey().then(setIsKeySelected).catch(console.error);
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading, isGeneratingImage, isGeneratingVideo, suggestedPrompts, relatedTopics]);
  useEffect(() => { localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem(RECENT_QUERIES_KEY, JSON.stringify(recentQueries)); }, [recentQueries]);
  useEffect(() => { localStorage.setItem(TODO_LIST_KEY, JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem(PERSONAS_KEY, JSON.stringify(personas)); }, [personas]);
  useEffect(() => { localStorage.setItem(ACTIVE_PERSONA_ID_KEY, activePersona?.id || ''); }, [activePersona]);
  useEffect(() => { localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, openAIApiKey || ''); }, [openAIApiKey]);
  useEffect(() => { localStorage.setItem(ANTHROPIC_API_KEY_STORAGE_KEY, anthropicApiKey || ''); }, [anthropicApiKey]);
  useEffect(() => { localStorage.setItem(AUTHORITATIVE_SOURCES_KEY, JSON.stringify(prioritizeAuthoritative)); }, [prioritizeAuthoritative]);

  useEffect(() => {
    localStorage.setItem(MODEL_STORAGE_KEY, JSON.stringify(model));
    if (messages.length > 1) {
      setModelExplanation({ isVisible: true, model: model });
      const timer = setTimeout(() => setModelExplanation({ isVisible: false, model: model }), 5000);
      return () => clearTimeout(timer);
    }
  }, [model]);
  
  useEffect(() => {
    try {
      const savedCss = localStorage.getItem(CUSTOM_CSS_KEY) || '';
      setCustomCss(savedCss);
      const styleElement = document.getElementById('custom-user-styles') || document.createElement('style');
      styleElement.id = 'custom-user-styles';
      styleElement.innerHTML = savedCss;
      document.head.appendChild(styleElement);
    } catch (error) { console.error("Failed to load or apply custom CSS:", error); }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?') { e.preventDefault(); setShowShortcutsModal(true); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); handleClearChat(); }
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
    setRecentQueries(prev => [query, ...prev.filter(q => q.toLowerCase().trim() !== query.toLowerCase().trim())].slice(0, 5));
  };

  const handleSendMessage = async (prompt: string, file: AttachedFile | null = attachedFile) => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt && !file) return;
    
    window.speechSynthesis.cancel();
    setSpeakingMessageIndex(null);

    if (trimmedPrompt === '/summarize') {
        setMessages(prev => [...prev, { role: 'user', text: trimmedPrompt, timestamp: new Date().toISOString() }]);
        handleSummarize();
        return;
    }

    const isImageCommand = trimmedPrompt.startsWith('/imagine ');
    const isVideoCommand = trimmedPrompt.startsWith('/create-video ');

    if ((isVideoCommand || isImageCommand) && model.provider === 'anthropic') {
        setMessages(prev => [...prev, { role: 'model', text: `Sorry, the ${isImageCommand ? 'image' : 'video'} generation command is not available with Anthropic models.`, isError: true, timestamp: new Date().toISOString() }]);
        return;
    }

    if (isVideoCommand && model.provider === 'openai') {
        setMessages(prev => [...prev, { role: 'model', text: "Sorry, video generation is only available with Google's models.", isError: true, timestamp: new Date().toISOString() }]);
        return;
    }

    const userMessage: ChatMessageType = { 
        role: 'user', 
        text: trimmedPrompt,
        timestamp: new Date().toISOString(),
        attachment: file,
        researchScope: model.provider === 'google' ? researchScope : undefined,
    };

    setSuggestedPrompts([]);
    setRelatedTopics([]);
    playSendSound();
    setAttachedFile(null);
    setResearchScope(null);

    if (isImageCommand) {
        setMessages(prev => [...prev, userMessage]);
        const imagePrompt = trimmedPrompt.substring(8).trim();
        if (!imagePrompt) {
            setMessages(prev => [...prev, { role: 'model', text: "Please provide a prompt after `/imagine`.", isError: true, timestamp: new Date().toISOString() }]);
            return;
        }
        setIsGeneratingImage(true);
        setCurrentImagePrompt(imagePrompt);
        try {
            const imageUrl = model.provider === 'google' 
                ? await generateImageWithImagen(imagePrompt)
                : await generateImageWithDallE(imagePrompt);
            setMessages(prev => [...prev, { role: 'model', text: imagePrompt, imageUrl, timestamp: new Date().toISOString() }]);
        } catch (error) {
            const parsedError = model.provider === 'google' ? parseGeminiError(error) : parseOpenAIError(error);
            setMessages(prev => [...prev, { role: 'model', text: parsedError.message, isError: true, originalText: trimmedPrompt, timestamp: new Date().toISOString() }]);
        } finally {
            setIsGeneratingImage(false);
            setCurrentImagePrompt(null);
        }
        return;
    }

    if (isVideoCommand) {
        setMessages(prev => [...prev, userMessage]);
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeySelected(hasKey);
        if (!hasKey) {
            setMessages(prev => prev.slice(0, -1));
            setApiKeySelectorProps({ show: true, title: 'API Key Required for Video', description: "To use video generation, you must select an API key from a project with billing enabled." });
            return;
        }
        const videoPrompt = trimmedPrompt.substring(14).trim();
        setIsGeneratingVideo(true);
        try {
            const videoUrl = await generateVideo(videoPrompt);
            setMessages(prev => [...prev, { role: 'model', text: videoPrompt, videoUrl, timestamp: new Date().toISOString() }]);
        } catch (error) {
            const parsedError = parseGeminiError(error);
            setMessages(prev => [...prev, { role: 'model', text: parsedError.message, isError: true, originalText: trimmedPrompt, timestamp: new Date().toISOString() }]);
        } finally {
            setIsGeneratingVideo(false);
        }
        return;
    }

    // Standard Chat Logic
    if (model.provider === 'openai' && !openAIApiKey) {
        setMessages(prev => [...prev, { role: 'model', text: "OpenAI API Key not set. Please add your key in Settings > API Key Manager to use this model.", isError: true, timestamp: new Date().toISOString() }]);
        return;
    }
    if (model.provider === 'anthropic' && !anthropicApiKey) {
        setMessages(prev => [...prev, { role: 'model', text: "Anthropic API Key not set. Please add your key in Settings > API Key Manager to use this model.", isError: true, timestamp: new Date().toISOString() }]);
        return;
    }

    setIsLoading(true);
    if (trimmedPrompt) addRecentQuery(trimmedPrompt);

    const historyForApi = [...messages, userMessage];
    setMessages(prev => [...prev, userMessage, { role: 'model', text: '', isThinking: true, timestamp: new Date().toISOString() }]);

    let currentResponse = '';
    let parsedError: { message: string, type: string };
    try {
        const handleStreamUpdate = (textChunk: string) => {
            currentResponse += textChunk;
            setMessages(prev => prev.map((msg, index) =>
                index === prev.length - 1 ? { ...msg, text: currentResponse, isThinking: false } : msg
            ));
        };

        const fileForApi = file ? { base64: file.base64, mimeType: file.type } : undefined;
        let sources: any[] = [];
        const systemInstruction = activePersona?.prompt;

        switch (model.provider) {
            case 'google':
                const result = await getGeminiResponseStream(historyForApi, dateFilter, handleStreamUpdate, model.id, researchScope, prioritizeAuthoritative, fileForApi, systemInstruction);
                sources = result.sources;
                break;
            case 'openai':
                await getOpenAIResponseStream(historyForApi, model.id, handleStreamUpdate, fileForApi, systemInstruction);
                break;
            case 'anthropic':
                await getClaudeResponseStream(historyForApi, model.id, handleStreamUpdate, fileForApi, systemInstruction);
                break;
        }

        playReceiveSound();
        if (sources.length > 0) {
            setMessages(prev => prev.map((msg, index) => index === prev.length - 1 ? { ...msg, sources } : msg));
        }

        // Generate suggestions and related topics
        switch (model.provider) {
            case 'google':
                getGeminiSuggestedPrompts(trimmedPrompt, currentResponse, model.id).then(setSuggestedPrompts);
                getGeminiRelatedTopics(trimmedPrompt, currentResponse, model.id).then(setRelatedTopics);
                break;
            case 'openai':
                getOpenAISuggestedPrompts(trimmedPrompt, currentResponse, model.id).then(setSuggestedPrompts);
                getOpenAIRelatedTopics(trimmedPrompt, currentResponse, model.id).then(setRelatedTopics);
                break;
            case 'anthropic':
                getClaudeSuggestedPrompts(trimmedPrompt, currentResponse, model.id).then(setSuggestedPrompts);
                getClaudeRelatedTopics(trimmedPrompt, currentResponse, model.id).then(setRelatedTopics);
                break;
        }

    } catch (error) {
        switch (model.provider) {
            case 'google': parsedError = parseGeminiError(error); break;
            case 'openai': parsedError = parseOpenAIError(error); break;
            case 'anthropic': parsedError = parseClaudeError(error); break;
            default: parsedError = { message: 'An unknown error occurred.', type: 'unknown' };
        }

        if (parsedError.type === 'api_key' || parsedError.type === 'permission' || parsedError.type === 'billing' && model.provider === 'google') {
            setApiKeySelectorProps({ show: true, title: 'API Key Error', description: parsedError.message });
        }
        setMessages(prev => prev.map((msg, index) =>
            index === prev.length - 1 ? { role: 'model', text: parsedError.message, isError: true, originalText: trimmedPrompt, timestamp: new Date().toISOString() } : msg
        ));
    } finally {
        setIsLoading(false);
    }
  };

  const handleToggleAudio = (text: string, index: number) => {
    if (speakingMessageIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingMessageIndex(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeakingMessageIndex(null);
    utterance.onerror = (event) => { console.error('SpeechSynthesisUtterance.onerror', event); setSpeakingMessageIndex(null); };
    window.speechSynthesis.speak(utterance);
    setSpeakingMessageIndex(index);
  };

  const handleClearChat = () => {
    window.speechSynthesis.cancel();
    setSpeakingMessageIndex(null);
    setMessages(getInitialMessages(model));
    setSuggestedPrompts([]);
    setRelatedTopics([]);
    setSummaryText(null);
  };
  
  const handleCopyAll = () => {
    const conversationText = messages.map(m => `${m.role === 'user' ? 'You' : 'Assistant'}:\n${m.text}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(conversationText).then(() => { setIsAllCopied(true); setTimeout(() => setIsAllCopied(false), 2000); });
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setShowSummaryModal(true);
    setSummaryText(null);
    try {
        let summary;
        let parsedError;
        switch(model.provider) {
            case 'google':
                summary = await getGeminiConversationSummary(messages, model.id);
                break;
            case 'openai':
                summary = await getOpenAIConversationSummary(messages, model.id);
                break;
            case 'anthropic':
                summary = await getClaudeConversationSummary(messages, model.id);
                break;
            default:
                throw new Error("Invalid model provider for summary.");
        }
        setSummaryText(summary);
    } catch (error) {
        let parsedError;
        switch(model.provider) {
            case 'google': parsedError = parseGeminiError(error); break;
            case 'openai': parsedError = parseOpenAIError(error); break;
            case 'anthropic': parsedError = parseClaudeError(error); break;
            default: parsedError = { message: 'An unknown error occurred while summarizing.'};
        }
        setSummaryText(`Error generating summary: ${parsedError.message}`);
    } finally {
        setIsSummarizing(false);
    }
  };
  
  const handleFeedback = (index: number, feedback: 'up' | 'down') => {
    setMessages(prev => prev.map((msg, i) => i === index ? { ...msg, feedback: msg.feedback === feedback ? undefined : feedback } : msg));
  };

  const handleRetry = (prompt: string) => {
    setMessages(prev => prev.filter(msg => msg.originalText !== prompt));
    handleSendMessage(prompt);
  };

  const handleSaveCss = (css: string) => {
    setCustomCss(css);
    try {
      localStorage.setItem(CUSTOM_CSS_KEY, css);
      const styleElement = document.getElementById('custom-user-styles') as HTMLStyleElement;
      styleElement.innerHTML = css;
    } catch (error) { console.error("Failed to save custom CSS:", error); }
    setIsCustomCssModalOpen(false);
  };

  // Task Handlers
  const handleAddTask = (text: string) => setTasks(prev => [...prev, { id: Date.now().toString(), text, completed: false }]);
  const handleToggleTask = (id: string) => setTasks(prev => prev.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  const handleDeleteTask = (id: string) => setTasks(prev => prev.filter(task => task.id !== id));
  const handleAddTaskFromMessage = (text: string) => handleAddTask(text);

  // Persona Handlers
  const handleSavePersona = (personaToSave: Persona) => {
    setPersonas(prev => {
        const existing = prev.find(p => p.id === personaToSave.id);
        if (existing) {
            return prev.map(p => p.id === personaToSave.id ? personaToSave : p);
        }
        return [...prev, personaToSave];
    });
    // If the saved persona is the active one, update it
    if (activePersona?.id === personaToSave.id) {
        setActivePersona(personaToSave);
    }
  };
  
  const handleDeletePersona = (id: string) => {
      setPersonas(prev => prev.filter(p => p.id !== id));
      if (activePersona?.id === id) {
          setActivePersona(null);
      }
  };
  
  const handleSaveOpenAIKey = (key: string) => setOpenAIApiKey(key);
  const handleSaveAnthropicKey = (key: string) => setAnthropicApiKey(key);
  const handleKeySelected = () => { setApiKeySelectorProps({ show: false }); setIsKeySelected(true); };
  const handleChangeApiKey = async () => { try { await window.aistudio.openSelectKey(); setIsKeySelected(true); setIsApiKeyManagerOpen(false); } catch (e) { console.error(e); } };
  const handleClearApiKey = async () => { try { await window.aistudio.clearSelectedApiKey?.(); setIsKeySelected(false); } catch (e) { console.error(e); } };

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
                            {openSubMenu === 'model' && <ModelSelector currentModel={model} onSetModel={setModel} onClose={() => { setOpenSubMenu(null); setIsSettingsMenuOpen(false); }} prioritizeAuthoritative={prioritizeAuthoritative} onTogglePrioritizeAuthoritative={() => setPrioritizeAuthoritative(p => !p)} isOpenAIConfigured={!!openAIApiKey} isAnthropicConfigured={!!anthropicApiKey} />}
                        </div>
                         <div className="my-1 h-px bg-[var(--border-color)]/50"></div>
                         <button onClick={() => { setIsPersonaManagerOpen(true); setIsSettingsMenuOpen(false); }} className="w-full text-left flex items-center space-x-2 p-2 text-sm rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"><UsersIcon className="w-4 h-4" /> <span>Persona Manager</span></button>
                         <button onClick={() => { setIsApiKeyManagerOpen(true); setIsSettingsMenuOpen(false); }} className="w-full text-left flex items-center space-x-2 p-2 text-sm rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"><KeyIcon className="w-4 h-4" /> <span>API Key Manager</span></button>
                         <button onClick={() => { setIsCustomCssModalOpen(true); setIsSettingsMenuOpen(false); }} className="w-full text-left flex items-center space-x-2 p-2 text-sm rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"><FileCodeIcon className="w-4 h-4" /> <span>Custom CSS</span></button>
                         <button onClick={() => { setIsTodoListModalOpen(true); setIsSettingsMenuOpen(false); }} className="w-full text-left flex items-center space-x-2 p-2 text-sm rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"><CheckSquareIcon className="w-4 h-4" /> <span>To-Do List</span></button>
                         <div className="my-1 h-px bg-[var(--border-color)]/50"></div>
                         <button onClick={() => { setIsExportModalOpen(true); setIsSettingsMenuOpen(false); }} className="w-full text-left flex items-center space-x-2 p-2 text-sm rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"><DownloadIcon className="w-4 h-4" /> <span>Export Chat</span></button>
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
                        speakingMessageIndex={speakingMessageIndex}
                        onToggleAudio={handleToggleAudio}
                        onAddTask={msg.role === 'model' && !msg.isError ? handleAddTaskFromMessage : undefined}
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
                {recentQueries.length > 0 && messages.length > 1 ? (
                    <RecentQueries queries={recentQueries} onQueryClick={handleSendMessage} onClear={() => setRecentQueries([])} />
                ) : (
                    messages.length <= 1 && <InitialPrompts prompts={getExamplePrompts(model)} onPromptClick={handleSendMessage} />
                )}
                <div className="mt-4">
                    <PersonaSelector 
                        personas={personas}
                        activePersona={activePersona}
                        onSelectPersona={setActivePersona}
                        onOpenManager={() => setIsPersonaManagerOpen(true)}
                    />
                </div>
              <div className="mt-2">
                <ChatInput
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading || isGeneratingImage || isGeneratingVideo}
                    activeFilter={dateFilter}
                    onFilterChange={setDateFilter}
                    isFilterMenuOpen={isFilterMenuOpen}
                    onToggleFilterMenu={() => setIsFilterMenuOpen(prev => !prev)}
                    onCloseFilterMenu={() => setIsFilterMenuOpen(false)}
                    researchScope={researchScope}
                    onSetResearchScope={setResearchScope}
                    attachedFile={attachedFile}
                    onSetAttachedFile={setAttachedFile}
                    provider={model.provider}
                />
              </div>
            </div>
        </div>
      </main>
    </div>

    {/* Modals and Overlays */}
    {showSummaryModal && <SummaryModal onClose={() => setShowSummaryModal(false)} summary={summaryText} isLoading={isSummarizing} />}
    {apiKeySelectorProps.show && <ApiKeySelector onKeySelected={handleKeySelected} title={apiKeySelectorProps.title} description={apiKeySelectorProps.description} />}
    {lightboxImageUrl && <Lightbox imageUrl={lightboxImageUrl} onClose={() => setLightboxImageUrl(null)} />}
    {showShortcutsModal && <KeyboardShortcutsModal onClose={() => setShowShortcutsModal(false)} />}
    {isApiKeyManagerOpen && <ApiKeyManager onClose={() => setIsApiKeyManagerOpen(false)} onChangeKey={handleChangeApiKey} onClearKey={handleClearApiKey} isKeySelected={isKeySelected} openAIApiKey={openAIApiKey} onSaveOpenAIKey={handleSaveOpenAIKey} anthropicApiKey={anthropicApiKey} onSaveAnthropicKey={handleSaveAnthropicKey} />}
    {isPersonaManagerOpen && <PersonaManager onClose={() => setIsPersonaManagerOpen(false)} personas={personas} onSave={handleSavePersona} onDelete={handleDeletePersona} />}
    {isCustomCssModalOpen && <CustomCssModal onClose={() => setIsCustomCssModalOpen(false)} onSave={handleSaveCss} initialCss={customCss} />}
    <ModelExplanationTooltip model={modelExplanation.model} isVisible={modelExplanation.isVisible} onClose={() => setModelExplanation({ isVisible: false, model: model })}/>
    {isTodoListModalOpen && <TodoListModal onClose={() => setIsTodoListModalOpen(false)} tasks={tasks} onAddTask={handleAddTask} onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} />}
    {isAboutModalOpen && <AboutModal onClose={() => setIsAboutModalOpen(false)} />}
    {isExportModalOpen && <ExportChatModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} messages={messages} />}
    </>
  );
};

export default App;