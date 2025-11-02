import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getGeminiResponseStream, getSuggestedPrompts, getConversationSummary, parseGeminiError, getRelatedTopics, generateImage, generateVideo } from './services/geminiService';
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
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
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
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState<boolean>(false);
  const [isApiKeyManagerOpen, setIsApiKeyManagerOpen] = useState(false);
  const [isDeepResearch, setIsDeepResearch] = useState<boolean>(false);
  const [customCss, setCustomCss] = useState<string>('');
  const [isCustomCssModalOpen, setIsCustomCssModalOpen] = useState<boolean>(false);
  const [modelExplanation, setModelExplanation] = useState<ModelExplanationState>({ isVisible: false, modelId: null });
  const [isTodoListModalOpen, setIsTodoListModalOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const summarizeButtonRef = useRef<HTMLButtonElement>(null);
  const summaryModalRef = useRef<HTMLDivElement>(null);
  const themeButtonRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const apiKeyButtonRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const tooltipTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const checkApiKey = async () => {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeySelected(hasKey);
    };
    checkApiKey();
  }, []);

  // Load custom CSS from localStorage on initial mount
  useEffect(() => {
    try {
        const savedCss = localStorage.getItem(CUSTOM_CSS_KEY);
        if (savedCss) {
            setCustomCss(savedCss);
        }
    } catch (error) {
        console.error("Failed to load custom CSS from localStorage:", error);
    }
  }, []);

  // Apply custom CSS to a style tag in the document head
  useEffect(() => {
      const styleTagId = 'custom-user-styles';
      let styleTag = document.getElementById(styleTagId) as HTMLStyleElement;

      if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = styleTagId;
          document.head.appendChild(styleTag);
      }

      styleTag.innerHTML = customCss;

      try {
          if (customCss) {
              localStorage.setItem(CUSTOM_CSS_KEY, customCss);
          } else {
              localStorage.removeItem(CUSTOM_CSS_KEY);
          }
      } catch (error) {
          console.error("Failed to save custom CSS to localStorage:", error);
      }
  }, [customCss]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
        const threshold = 100; // pixels
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        isAtBottomRef.current = scrollHeight - clientHeight <= scrollTop + threshold;
    }
  };

  // Auto-scroll logic: only scroll to the bottom if the user is already near the bottom.
  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom();
    }
  }, [messages, isLoading, suggestedPrompts, relatedTopics, isGeneratingImage, isGeneratingVideo]);

  useEffect(() => {
    try {
      if (messages.length > 1 || (messages.length === 1 && messages[0].text !== initialMessages[0].text)) {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
      } else {
        localStorage.removeItem(CHAT_HISTORY_KEY);
      }
    } catch (error) {
      console.error("Failed to save chat history to localStorage:", error);
    }
  }, [messages]);

  useEffect(() => {
    try {
        localStorage.setItem(TODO_LIST_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error("Failed to save tasks to localStorage:", error);
    }
  }, [tasks]);

  useEffect(() => {
    try {
        localStorage.setItem(MODEL_STORAGE_KEY, model);
    } catch (error) {
        console.error("Failed to save model to localStorage:", error);
    }
  }, [model]);

  const handleClearChat = useCallback(() => {
    setMessages(initialMessages);
    setSuggestedPrompts([]);
    setRelatedTopics([]);
    try {
      localStorage.removeItem(CHAT_HISTORY_KEY);
    } catch (error) {
      console.error("Failed to clear chat history from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        handleClearChat();
      }

      if (event.key.toLowerCase() === 'f' && !isTyping) {
        event.preventDefault();
        setIsFilterMenuOpen(prev => !prev);
      }

      if (event.key === '?' && !isTyping) {
        event.preventDefault();
        setShowSummaryModal(false);
        setIsFilterMenuOpen(false);
        setShowShortcutsModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClearChat]);

  // Close theme selector on outside click
  useEffect(() => {
    if (!isThemeSelectorOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
        if (themeButtonRef.current && !themeButtonRef.current.contains(event.target as Node)) {
            setIsThemeSelectorOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isThemeSelectorOpen]);

  // Close model selector on outside click
  useEffect(() => {
    if (!isModelSelectorOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
        if (settingsButtonRef.current && !settingsButtonRef.current.contains(event.target as Node)) {
            setIsModelSelectorOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModelSelectorOpen]);

  const handleSendMessage = useCallback(async (inputText: string) => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput || isLoading) return;
  
    const userMessage: ChatMessageType = { role: 'user', text: trimmedInput };
    const isImagine = trimmedInput.toLowerCase().startsWith('/imagine ');
    const isVideo = trimmedInput.toLowerCase().startsWith('/create-video ');

    // For text generation, add a thinking bubble immediately.
    if (!isImagine && !isVideo) {
        const thinkingMessage: ChatMessageType = { role: 'model', text: '', isThinking: true, sources: [] };
        setMessages(prev => [...prev, userMessage, thinkingMessage]);
    } else {
        setMessages(prev => [...prev, userMessage]);
    }

    // Reset deep research mode after use
    if (isDeepResearch) {
        setIsDeepResearch(false);
    }

    setIsLoading(true);
    setSuggestedPrompts([]);
    setRelatedTopics([]);
    setIsFilterMenuOpen(false);
  
    try {
        if (isImagine) {
            const imagePrompt = trimmedInput.substring(8).trim();
            if (imagePrompt) {
                setIsGeneratingImage(true);
                setCurrentImagePrompt(imagePrompt);
                const imageUrl = await generateImage(imagePrompt);
                const modelMessage: ChatMessageType = {
                    role: 'model',
                    text: imagePrompt,
                    imageUrl: imageUrl,
                    sources: []
                };
                setMessages(prev => [...prev, modelMessage]);
            } else {
                 throw new Error("Please provide a prompt after the /imagine command.");
            }
        } else if (isVideo) {
            if (!isKeySelected) {
                throw new Error("API key not selected. Please select an API key before generating videos.");
            }
            setIsGeneratingVideo(true);
            const videoPrompt = trimmedInput.substring(14).trim();
            if (videoPrompt) {
                const videoUrl = await generateVideo(videoPrompt);
                const modelMessage: ChatMessageType = {
                    role: 'model',
                    text: videoPrompt,
                    videoUrl: videoUrl,
                    sources: []
                };
                setMessages(prev => [...prev, modelMessage]);
            } else {
                throw new Error("Please provide a prompt after the /create-video command.");
            }
        } else {
            let firstChunkReceived = false;
            // The history for the API is the conversation state *before* adding the new user message.
            // This correctly uses the `messages` from the component's state at the time of sending.
            const historyForApi: ChatMessageType[] = [...messages, userMessage];

            // Use the more powerful model for deep research mode
            const effectiveModel = isDeepResearch ? 'gemini-2.5-pro' : model;

            const { sources } = await getGeminiResponseStream(
                historyForApi,
                dateFilter,
                (chunkText) => {
                    if (!firstChunkReceived) {
                        firstChunkReceived = true;
                        setMessages(prev => [
                            ...prev.slice(0, -1), // Replace the thinking bubble
                            { role: 'model', text: chunkText, sources: [] }
                        ]);
                    } else {
                        setMessages(prev => {
                            const lastMessage = prev[prev.length - 1];
                            const updatedLastMessage = { ...lastMessage, text: lastMessage.text + chunkText };
                            return [...prev.slice(0, -1), updatedLastMessage];
                        });
                    }
                },
                effectiveModel,
                isDeepResearch // Pass deep research flag to service
            );

            let finalModelResponseText = '';
            setMessages(prevMessages => {
                const lastMessage = prevMessages[prevMessages.length - 1];
                if (lastMessage?.role === 'model') {
                    finalModelResponseText = lastMessage.text;
                    const updatedLastMessage = { ...lastMessage, sources: sources };
                    return [...prevMessages.slice(0, -1), updatedLastMessage];
                }
                return prevMessages;
            });

            if (finalModelResponseText.trim()) {
                const lastUserPrompt = userMessage.text;

                // Truncate response to avoid hitting token limits on suggestion calls
                const MAX_RESPONSE_LENGTH = 4000; // characters
                const truncatedResponse = finalModelResponseText.length > MAX_RESPONSE_LENGTH
                    ? finalModelResponseText.substring(0, MAX_RESPONSE_LENGTH) + "..."
                    : finalModelResponseText;

                await Promise.all([
                    (async () => {
                        try {
                            const suggestions = await getSuggestedPrompts(lastUserPrompt, truncatedResponse, model);
                            setSuggestedPrompts(suggestions);
                        } catch (suggestionError) {
                            console.error("Failed to fetch suggested prompts:", suggestionError);
                        }
                    })(),
                    (async () => {
                        try {
                            const topics = await getRelatedTopics(lastUserPrompt, truncatedResponse, model);
                            setRelatedTopics(topics);
                        } catch (topicError) {
                            console.error("Failed to fetch related topics:", topicError);
                        }
                    })()
                ]);
            }
        }
    } catch (error) {
        console.error("Failed to get Gemini response:", error);
        const parsedError = parseGeminiError(error);
        
        if (parsedError.type === 'api_key') {
            setIsKeySelected(false);
        }

        const errorMessage: ChatMessageType = {
            role: 'model',
            text: parsedError.message,
            sources: [],
            isError: true,
            originalText: parsedError.retryable ? trimmedInput : undefined,
        };
        
        setMessages(prev => {
            const lastMessage = prev[prev.length - 1];

            // If the last message is a thinking bubble or a partially streamed response, replace it.
            if (lastMessage?.isThinking || (lastMessage?.role === 'model' && !lastMessage.imageUrl && !lastMessage.videoUrl)) {
                return [...prev.slice(0, -1), errorMessage];
            }
            
            // Otherwise, append the error message (e.g., after an image/video generation)
            return [...prev, errorMessage];
        });
    } finally {
        setIsLoading(false);
        setIsGeneratingImage(false);
        setCurrentImagePrompt(null);
        setIsGeneratingVideo(false);
    }
  }, [messages, isLoading, dateFilter, isKeySelected, model, isDeepResearch]);

  const handleCopyAll = () => {
    const conversationText = messages.map(msg => {
      let formattedMessage = `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.text}`;
      if (msg.role === 'model' && msg.sources && msg.sources.length > 0) {
        const sourcesText = msg.sources
          .map(source => `- ${source.web?.title}: ${source.web?.uri}`)
          .join('\n');
        formattedMessage += `\n\nSources:\n${sourcesText}`;
      }
      return formattedMessage;
    }).join('\n\n---\n\n');
  
    navigator.clipboard.writeText(conversationText).then(() => {
      setIsAllCopied(true);
      setTimeout(() => setIsAllCopied(false), 2000);
    }).catch(err => {
      console.error("Failed to copy conversation:", err);
    });
  };

  const handleExportChat = useCallback(() => {
    if (messages.length <= 1) return;
  
    try {
      const chatData = JSON.stringify(messages, null, 2);
      const blob = new Blob([chatData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      link.download = `gemini-chat-history-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export chat history:", error);
    }
  }, [messages]);

  const handleFeedback = (messageIndex: number, feedback: 'up' | 'down') => {
    setMessages(prevMessages => 
      prevMessages.map((msg, index) => {
        if (index === messageIndex) {
          const newFeedback = msg.feedback === feedback ? undefined : feedback;
          // Log feedback to console
          console.log(`Feedback received for message ${index}: ${newFeedback || 'cleared'}`);
          // In a real application, you would send this to an analytics endpoint.
          // Example: sendToAnalytics('message_feedback', { messageId: msg.id, feedback: newFeedback });
          return { ...msg, feedback: newFeedback };
        }
        return msg;
      })
    );
  };

  const handleRetry = useCallback((promptToRetry: string) => {
    // Remove the user's failed prompt and the model's error response
    setMessages(prev => prev.slice(0, -2));
    
    // A short timeout ensures the state update is processed before resending,
    // preventing race conditions with React's batching.
    setTimeout(() => {
        handleSendMessage(promptToRetry);
    }, 50);
  }, [handleSendMessage]);

  const closeSummaryModal = useCallback(() => {
    setShowSummaryModal(false);
    summarizeButtonRef.current?.focus();
  }, []);
  
  useEffect(() => {
    if (showSummaryModal) {
      const modalElement = summaryModalRef.current;
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
          closeSummaryModal();
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
    }
  }, [showSummaryModal, closeSummaryModal]);

  const handleSummarize = useCallback(async () => {
    if (messages.length <= 1 || isSummarizing) return;

    setShowSummaryModal(true);
    setIsSummarizing(true);
    setSummaryText(null);

    try {
        const summary = await getConversationSummary(messages, model);
        setSummaryText(summary);
    } catch (error) {
        console.error("Failed to get summary:", error);
        const errorText = parseGeminiError(error).message;
        setSummaryText(errorText);
    } finally {
        setIsSummarizing(false);
    }
  }, [messages, isSummarizing, model]);

  const handleCopySummary = () => {
    if (!summaryText) return;
    navigator.clipboard.writeText(summaryText).then(() => {
        setIsSummaryCopied(true);
        setTimeout(() => setIsSummaryCopied(false), 2000);
    }).catch(err => {
        console.error("Failed to copy summary:", err);
    });
  };

  const handleChangeApiKey = async () => {
      try {
          await window.aistudio.openSelectKey();
          setIsKeySelected(true);
      } catch (error) {
          console.error("Error opening API key selection:", error);
      } finally {
          setIsApiKeyManagerOpen(false);
      }
  };

  const handleClearApiKey = async () => {
      try {
          if (window.aistudio.clearSelectedApiKey) {
              await window.aistudio.clearSelectedApiKey();
          }
          setIsKeySelected(false);
      } catch (error) {
          console.error("Error clearing API key:", error);
      } finally {
          setIsApiKeyManagerOpen(false);
      }
  };

  const handleSaveCustomCss = (css: string) => {
    setCustomCss(css);
    setIsCustomCssModalOpen(false);
  };

  const handleSetModel = useCallback((newModel: ModelId) => {
    if (model !== newModel) {
        setModel(newModel);

        if (tooltipTimeoutRef.current) {
            clearTimeout(tooltipTimeoutRef.current);
        }

        setModelExplanation({ isVisible: true, modelId: newModel });

        tooltipTimeoutRef.current = window.setTimeout(() => {
            setModelExplanation({ isVisible: false, modelId: newModel });
        }, 5000);
    }
  }, [model]);

  const closeModelExplanation = () => {
     if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
    }
    setModelExplanation(prev => ({ ...prev, isVisible: false }));
  };

  // To-Do List Handlers
  const handleAddTask = (text: string) => {
    const newTask: Task = {
        id: Date.now().toString(),
        text,
        completed: false
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  const handleToggleTask = (id: string) => {
    setTasks(prevTasks =>
        prevTasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        )
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
  };


  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
      {!isKeySelected && <ApiKeySelector onKeySelected={() => setIsKeySelected(true)} />}
      <header className="relative z-10 flex items-center justify-between px-2 py-3 sm:px-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3 min-w-0 flex-shrink">
            <BotIcon className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--accent-primary)] flex-shrink-0" />
            <div className="min-w-0">
                <h1 className="text-md sm:text-xl font-bold text-[var(--text-primary)] truncate">Conversational Search</h1>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] flex items-center">
                    <SearchIcon className="w-3.5 h-3.5 mr-1.5 hidden sm:block" />
                    <span className="truncate">Powered by Google Search Grounding</span>
                </p>
            </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <button
                onClick={handleClearChat}
                className="p-1.5 sm:p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                aria-label="New Chat (Ctrl+K)"
                title="New Chat (Ctrl+K)"
            >
                <PlusSquareIcon className="w-5 h-5" />
            </button>
            <div className="relative">
              <button
                  ref={settingsButtonRef}
                  onClick={() => setIsModelSelectorOpen(prev => !prev)}
                  className="p-1.5 sm:p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                  aria-label="Model settings"
                  title="Model settings"
              >
                  <SettingsIcon className="w-5 h-5" />
              </button>
              {isModelSelectorOpen && (
                  <ModelSelector
                      currentModel={model}
                      onSetModel={handleSetModel}
                      onClose={() => setIsModelSelectorOpen(false)}
                  />
              )}
            </div>
            <button
                ref={apiKeyButtonRef}
                onClick={() => setIsApiKeyManagerOpen(true)}
                className="p-1.5 sm:p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                aria-label="Manage API Key"
                title="Manage API Key"
            >
                <KeyIcon className="w-5 h-5" />
            </button>
            <button
                onClick={() => setIsTodoListModalOpen(true)}
                className="p-1.5 sm:p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                aria-label="Open to-do list"
                title="To-Do List"
            >
                <CheckSquareIcon className="w-5 h-5" />
            </button>
            <button
                onClick={() => setIsCustomCssModalOpen(true)}
                className="p-1.5 sm:p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                aria-label="Edit custom CSS"
                title="Edit custom CSS"
            >
                <FileCodeIcon className="w-5 h-5" />
            </button>
            <div className="relative" ref={themeButtonRef}>
              <button
                  onClick={() => setIsThemeSelectorOpen(prev => !prev)}
                  className="p-1.5 sm:p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                  aria-label="Select theme"
                  title="Select theme"
              >
                  <PaletteIcon className="w-5 h-5" />
              </button>
              {isThemeSelectorOpen && <ThemeSelector onClose={() => setIsThemeSelectorOpen(false)} />}
            </div>
             <button
                onClick={() => setIsAboutModalOpen(true)}
                className="p-1.5 sm:p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                aria-label="About this application"
                title="About"
            >
                <InfoIcon className="w-5 h-5" />
            </button>
            <button
                onClick={() => setShowShortcutsModal(true)}
                className="p-1.5 sm:p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                aria-label="Show keyboard shortcuts (?)"
                title="Keyboard shortcuts (?)"
            >
                <HelpCircleIcon className="w-5 h-5" />
            </button>
            <button
                ref={summarizeButtonRef}
                onClick={handleSummarize}
                className="p-1.5 sm:p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200 flex-shrink-0 disabled:text-[var(--text-muted)]/50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                aria-label="Summarize conversation"
                title="Summarize conversation"
                disabled={isLoading || isSummarizing || messages.length <= 1}
            >
                <SparklesIcon className="w-5 h-5" />
            </button>
            <button
                onClick={handleCopyAll}
                className="p-1.5 sm:p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200 flex-shrink-0"
                aria-label="Copy entire chat"
                title="Copy chat"
            >
                {isAllCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardListIcon className="w-5 h-5" />}
            </button>
            <button
                onClick={handleExportChat}
                className="p-1.5 sm:p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200 flex-shrink-0 disabled:text-[var(--text-muted)]/50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                aria-label="Export chat as JSON"
                title="Export chat (JSON)"
                disabled={isLoading || isSummarizing || messages.length <= 1}
            >
                <DownloadIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleClearChat}
              className="p-1.5 sm:p-2 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200 flex-shrink-0"
              aria-label="Clear chat history"
              title="Clear chat"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
        </div>
      </header>
      
      <main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2 py-4 sm:p-4 md:p-6 space-y-6"
      >
        <div className="max-w-4xl mx-auto w-full">
            {messages.map((msg, index) => (
                <ErrorBoundary key={index}>
                    <ChatMessage 
                        message={msg}
                        messageIndex={index}
                        onFeedback={handleFeedback}
                        onImageClick={setLightboxImageUrl}
                        onRetry={handleRetry}
                    />
                </ErrorBoundary>
            ))}
            {isGeneratingImage && <PlaceholderLoader type="image" prompt={currentImagePrompt} />}
            {isGeneratingVideo && <PlaceholderLoader type="video" />}
            {isLoading && !isGeneratingImage && !isGeneratingVideo && messages[messages.length - 1]?.isThinking !== true && (
                <div className="pl-12 mt-4 animate-fade-in" role="status" aria-live="polite">
                    <div className="inline-flex items-center space-x-3 text-[var(--text-muted)] p-2 bg-[var(--bg-secondary)]/50 rounded-lg">
                      <SparklesIcon className="w-5 h-5 text-[var(--accent-primary)] animate-pulse-icon" />
                      <span className="text-sm font-medium">Generating response & suggestions...</span>
                    </div>
                </div>
            )}
            {(suggestedPrompts.length > 0 || relatedTopics.length > 0) && !isLoading && (
              <div className="pl-12 animate-fade-in mt-4 space-y-5">
                {suggestedPrompts.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-muted)] mb-3">People also ask</h2>
                    <div className="space-y-2">
                      {suggestedPrompts.map((prompt, index) => (
                        <button
                          key={`suggestion-${index}`}
                          onClick={() => handleSendMessage(prompt)}
                          className="w-full text-left text-sm flex items-center justify-between p-3 rounded-lg bg-[var(--bg-secondary)]/60 backdrop-blur-sm hover:bg-[var(--bg-tertiary)]/60 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200 group"
                        >
                          <span className="pr-2">{prompt}</span>
                          <ChevronRightIcon className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                 {relatedTopics.length > 0 && (
                    <div>
                        <h2 className="text-sm font-semibold text-[var(--text-muted)] mb-3 flex items-center space-x-2">
                            <LightbulbIcon className="w-4 h-4" />
                            <span>Explore related</span>
                        </h2>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            {relatedTopics.map((topic, index) => (
                                <button
                                    key={`topic-${index}`}
                                    onClick={() => handleSendMessage(topic)}
                                    className="text-xs sm:text-sm bg-[var(--bg-secondary)]/60 backdrop-blur-sm hover:bg-[var(--bg-tertiary)]/60 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all duration-200"
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            )}
             {messages.length === 1 && !isLoading && suggestedPrompts.length === 0 && (
              <div className="pl-12 animate-fade-in -mt-2">
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {examplePrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-xs sm:text-sm bg-[var(--bg-secondary)]/60 backdrop-blur-sm hover:bg-[var(--bg-tertiary)]/60 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all duration-200"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-2 sm:p-4 md:p-6 border-t border-[var(--border-color)] bg-[var(--bg-primary)]/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <ErrorBoundary fallbackMessage="The chat input component has crashed. Please reload the page to continue.">
            <ChatInput 
              onSendMessage={handleSendMessage} 
              isLoading={isLoading} 
              placeholder={isDeepResearch ? 'Ask a detailed research question...' : 'Ask me anything, or use /imagine or /create-video...'}
              activeFilter={dateFilter}
              onFilterChange={setDateFilter}
              isFilterMenuOpen={isFilterMenuOpen}
              onToggleFilterMenu={() => setIsFilterMenuOpen(prev => !prev)}
              onCloseFilterMenu={() => setIsFilterMenuOpen(false)}
              isDeepResearch={isDeepResearch}
              onToggleDeepResearch={() => setIsDeepResearch(prev => !prev)}
            />
          </ErrorBoundary>
        </div>
      </footer>

      {showSummaryModal && (
        <div
          ref={summaryModalRef}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          aria-labelledby="summary-modal-title"
          role="dialog"
          aria-modal="true"
          onClick={closeSummaryModal}
        >
          <div
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl w-full max-w-md sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <header className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
              <div className="flex items-center space-x-3">
                <SparklesIcon className="w-6 h-6 text-[var(--accent-primary)]" />
                <h2 id="summary-modal-title" className="text-lg font-semibold text-[var(--text-primary)]">
                  Conversation Summary
                </h2>
              </div>
              <button
                onClick={closeSummaryModal}
                className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Close summary"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </header>
    
            <main className="p-6 overflow-y-auto prose prose-themed max-w-none">
              {isSummarizing ? (
                <div className="flex flex-col items-center justify-center text-[var(--text-muted)] space-y-3" role="status">
                  <SparklesIcon className="w-10 h-10 text-[var(--accent-primary)] animate-pulse-icon" />
                  <p>Generating summary...</p>
                </div>
              ) : (
                <p>{summaryText}</p>
              )}
            </main>
    
            <footer className="flex items-center justify-end p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
              <div className="flex items-center space-x-3">
                <button
                  onClick={closeSummaryModal}
                  className="px-4 py-2 rounded-md text-[var(--text-secondary)] bg-[var(--bg-tertiary)]/80 hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleCopySummary}
                  disabled={isSummarizing || !summaryText}
                  className="px-4 py-2 rounded-md text-white bg-[var(--accent-primary)] hover:opacity-90 disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed transition-all flex items-center space-x-2"
                >
                  {isSummaryCopied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
                  <span>{isSummaryCopied ? 'Copied!' : 'Copy Summary'}</span>
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {lightboxImageUrl && (
        <Lightbox 
          imageUrl={lightboxImageUrl}
          onClose={() => setLightboxImageUrl(null)}
        />
      )}

      {showShortcutsModal && (
        <KeyboardShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}
      
      {isAboutModalOpen && (
        <AboutModal onClose={() => setIsAboutModalOpen(false)} />
      )}

      {isApiKeyManagerOpen && (
        <ApiKeyManager
            onClose={() => setIsApiKeyManagerOpen(false)}
            onChangeKey={handleChangeApiKey}
            onClearKey={handleClearApiKey}
            isKeySelected={isKeySelected}
        />
      )}

      {isCustomCssModalOpen && (
        <CustomCssModal
            initialCss={customCss}
            onSave={handleSaveCustomCss}
            onClose={() => setIsCustomCssModalOpen(false)}
        />
      )}

      {isTodoListModalOpen && (
        <TodoListModal
            tasks={tasks}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onClose={() => setIsTodoListModalOpen(false)}
        />
      )}

      <ModelExplanationTooltip
          modelId={modelExplanation.modelId}
          isVisible={modelExplanation.isVisible}
          onClose={closeModelExplanation}
      />
    </div>
  );
};

export default App;