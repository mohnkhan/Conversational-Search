import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getGeminiResponseStream, getSuggestedPrompts, getConversationSummary, parseGeminiError, getRelatedTopics, generateImage, generateVideo, ParsedError } from './services/geminiService';
import { ChatMessage as ChatMessageType, DateFilter, ModelId } from './types';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { BotIcon, SearchIcon, TrashIcon, ClipboardListIcon, CheckIcon, SparklesIcon, XIcon, CopyIcon, ImageIcon, VideoIcon, DownloadIcon, PaletteIcon, HelpCircleIcon, SettingsIcon } from './components/Icons';
import ApiKeySelector from './components/ApiKeySelector';
import Lightbox from './components/Lightbox';
import ErrorBoundary from './components/ErrorBoundary';
import ThemeSelector from './components/ThemeSelector';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import ModelSelector from './components/ModelSelector';

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

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const summarizeButtonRef = useRef<HTMLButtonElement>(null);
  const summaryModalRef = useRef<HTMLDivElement>(null);
  const themeButtonRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const checkApiKey = async () => {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeySelected(hasKey);
    };
    checkApiKey();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isThinking, suggestedPrompts, relatedTopics, isGeneratingImage, isGeneratingVideo]);

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
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setSuggestedPrompts([]);
    setRelatedTopics([]);
    setIsFilterMenuOpen(false);
  
    try {
        if (trimmedInput.toLowerCase().startsWith('/imagine ')) {
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
        } else if (trimmedInput.toLowerCase().startsWith('/create-video ')) {
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
            setIsThinking(true);
            let firstChunkReceived = false;
            const { sources } = await getGeminiResponseStream(
                newMessages,
                dateFilter,
                (chunkText) => {
                    if (!firstChunkReceived) {
                        firstChunkReceived = true;
                        setIsThinking(false);
                        setMessages(prev => [
                            ...prev,
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
                model
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
                const conversationForSuggestions = newMessages.concat({
                    role: 'model',
                    text: finalModelResponseText,
                });
                const lastUserPrompt = userMessage.text;

                await Promise.all([
                    (async () => {
                        try {
                            const suggestions = await getSuggestedPrompts(lastUserPrompt, finalModelResponseText, model);
                            setSuggestedPrompts(suggestions);
                        } catch (suggestionError) {
                            console.error("Failed to fetch suggested prompts:", suggestionError);
                        }
                    })(),
                    (async () => {
                        try {
                            const topics = await getRelatedTopics(lastUserPrompt, finalModelResponseText, model);
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
            originalText: trimmedInput,
        };
        
        setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage.role === 'user' && lastMessage.text === trimmedInput) {
                return [...prev, errorMessage];
            }
            if (lastMessage.role === 'model' && (lastMessage.imageUrl || lastMessage.videoUrl)) {
                 return [...prev, errorMessage];
            }
            // This case handles when streaming fails after starting
            return [...prev.slice(0, -1), errorMessage];
        });
    } finally {
        setIsLoading(false);
        setIsThinking(false);
        setIsGeneratingImage(false);
        setCurrentImagePrompt(null);
        setIsGeneratingVideo(false);
    }
  }, [messages, isLoading, dateFilter, isKeySelected, model]);

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

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
      {!isKeySelected && <ApiKeySelector onKeySelected={() => setIsKeySelected(true)} />}
      <header className="relative z-10 flex items-center justify-between px-2 py-3 sm:px-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3 min-w-0 flex-shrink">
            <BotIcon className="w-7 h-7 sm:w-8 sm:h-8 text-[var(--accent-primary)] flex-shrink-0" />
            <div className="min-w-0">
                <h1 className="text-md sm:text-xl font-bold text-[var(--text-primary)] truncate">Gemini Conversational Search</h1>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] flex items-center">
                    <SearchIcon className="w-3.5 h-3.5 mr-1.5 hidden sm:block" />
                    <span className="truncate">Powered by Google Search Grounding</span>
                </p>
            </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
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
                      onSetModel={setModel}
                      onClose={() => setIsModelSelectorOpen(false)}
                  />
              )}
            </div>
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
              aria-label="Clear chat history (Ctrl+K)"
              title="Clear chat (Ctrl+K)"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-2 py-4 sm:p-4 md:p-6 space-y-6">
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
             {isThinking && (
                <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 my-2 animate-fade-in" role="status" aria-live="polite">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-[var(--bg-accent-translucent)]">
                        <BotIcon className="w-5 h-5 text-[var(--accent-primary)] animate-pulse-icon" />
                    </div>
                    <div className="flex-1 group relative pt-1.5 sm:pt-2">
                        <p className="text-[var(--text-muted)] italic">Thinking...</p>
                    </div>
                </div>
             )}
            {isGeneratingImage && <PlaceholderLoader type="image" prompt={currentImagePrompt} />}
            {isGeneratingVideo && <PlaceholderLoader type="video" />}
            {isLoading && !isThinking && !isGeneratingImage && !isGeneratingVideo &&(
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
                    <h2 className="text-sm font-semibold text-[var(--text-muted)] mb-2">Next questions</h2>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {suggestedPrompts.map((prompt, index) => (
                        <button
                          key={`suggestion-${index}`}
                          onClick={() => handleSendMessage(prompt)}
                          className="text-xs sm:text-sm bg-[var(--bg-secondary)]/60 backdrop-blur-sm hover:bg-[var(--bg-tertiary)]/60 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all duration-200"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                 {relatedTopics.length > 0 && (
                    <div>
                        <h2 className="text-sm font-semibold text-[var(--text-muted)] mb-2">Explore related</h2>
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
              placeholder="Ask me anything, or use /imagine or /create-video..."
              activeFilter={dateFilter}
              onFilterChange={setDateFilter}
              isFilterMenuOpen={isFilterMenuOpen}
              onToggleFilterMenu={() => setIsFilterMenuOpen(prev => !prev)}
              onCloseFilterMenu={() => setIsFilterMenuOpen(false)}
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
    </div>
  );
};

export default App;
