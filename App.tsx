import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getGeminiResponseStream, getSuggestedPrompts, getConversationSummary, parseGeminiError, getRelatedTopics, generateImage, generateVideo, ParsedError } from './services/geminiService';
import { ChatMessage as ChatMessageType, DateFilter } from './types';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { BotIcon, SearchIcon, TrashIcon, ClipboardListIcon, CheckIcon, SparklesIcon, XIcon, CopyIcon, ImageIcon, VideoIcon, DownloadIcon } from './components/Icons';
import ApiKeySelector from './components/ApiKeySelector';
import Lightbox from './components/Lightbox';
import ErrorBoundary from './components/ErrorBoundary';

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
             <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-cyan-500/20">
                <BotIcon className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex-1 group relative pt-1">
                <div className="w-full max-w-sm aspect-video bg-gray-800 rounded-lg border border-gray-700 flex flex-col items-center justify-center p-4 animate-shimmer">
                    <Icon className="w-10 h-10 text-gray-500 mb-3" />
                    {type === 'image' && prompt && (
                         <p className="text-sm font-medium text-gray-300 text-center px-4 italic truncate" title={prompt}>
                            "{prompt}"
                         </p>
                    )}
                    {type === 'image' && (
                        <p className="text-xs font-mono text-gray-500 mt-2">{formatTime(elapsedSeconds)}</p>
                    )}
                    <p className="text-sm text-gray-400 text-center px-4 mt-3">{currentText}</p>
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClearChat]);

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
                }
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
                            const suggestions = await getSuggestedPrompts(lastUserPrompt, finalModelResponseText);
                            setSuggestedPrompts(suggestions);
                        } catch (suggestionError) {
                            console.error("Failed to fetch suggested prompts:", suggestionError);
                        }
                    })(),
                    (async () => {
                        try {
                            const topics = await getRelatedTopics(lastUserPrompt, finalModelResponseText);
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
        
        // If the error indicates a problem with the API key, reset the selection state
        // to prompt the user to select a new one.
        if (parsedError.type === 'api_key') {
            setIsKeySelected(false);
        }

        const errorMessage: ChatMessageType = {
            role: 'model',
            text: parsedError.message,
            sources: [],
            isError: true,
        };
        
        setMessages(prev => {
            // Check if the last message is the user's prompt
            const lastMessage = prev[prev.length - 1];
            if (lastMessage.role === 'user' && lastMessage.text === trimmedInput) {
                return [...prev, errorMessage];
            }
            // If the last message is already a model response (e.g. from /imagine), append the error.
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
  }, [messages, isLoading, dateFilter, isKeySelected]);

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

  const handleSummarize = useCallback(async () => {
    if (messages.length <= 1 || isSummarizing) return;

    setShowSummaryModal(true);
    setIsSummarizing(true);
    setSummaryText(null);

    try {
        const summary = await getConversationSummary(messages);
        setSummaryText(summary);
    } catch (error) {
        console.error("Failed to get summary:", error);
        const errorText = parseGeminiError(error).message;
        setSummaryText(errorText);
    } finally {
        setIsSummarizing(false);
    }
  }, [messages, isSummarizing]);

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
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      {!isKeySelected && <ApiKeySelector onKeySelected={() => setIsKeySelected(true)} />}
      <header className="flex items-center justify-between px-2 py-3 sm:px-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3 min-w-0 flex-shrink">
            <BotIcon className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400 flex-shrink-0" />
            <div className="min-w-0">
                <h1 className="text-md sm:text-xl font-bold text-white truncate">Gemini Conversational Search</h1>
                <p className="text-xs sm:text-sm text-gray-400 flex items-center">
                    <SearchIcon className="w-3.5 h-3.5 mr-1.5 hidden sm:block" />
                    <span className="truncate">Powered by Google Search Grounding</span>
                </p>
            </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <button
                onClick={handleSummarize}
                className="p-1.5 sm:p-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200 flex-shrink-0 disabled:text-gray-600 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                aria-label="Summarize conversation"
                title="Summarize conversation"
                disabled={isLoading || isSummarizing || messages.length <= 1}
            >
                <SparklesIcon className="w-5 h-5" />
            </button>
            <button
                onClick={handleCopyAll}
                className="p-1.5 sm:p-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200 flex-shrink-0"
                aria-label="Copy entire chat"
                title="Copy chat"
            >
                {isAllCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardListIcon className="w-5 h-5" />}
            </button>
            <button
                onClick={handleExportChat}
                className="p-1.5 sm:p-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200 flex-shrink-0 disabled:text-gray-600 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                aria-label="Export chat as JSON"
                title="Export chat (JSON)"
                disabled={isLoading || isSummarizing || messages.length <= 1}
            >
                <DownloadIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleClearChat}
              className="p-1.5 sm:p-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200 flex-shrink-0"
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
                    />
                </ErrorBoundary>
            ))}
             {isThinking && (
                <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 my-2 animate-fade-in">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-cyan-500/20">
                        <BotIcon className="w-5 h-5 text-cyan-400 animate-pulse-icon" />
                    </div>
                    <div className="flex-1 group relative pt-1.5 sm:pt-2">
                        <p className="text-gray-400 italic">Thinking...</p>
                    </div>
                </div>
             )}
            {isGeneratingImage && <PlaceholderLoader type="image" prompt={currentImagePrompt} />}
            {isGeneratingVideo && <PlaceholderLoader type="video" />}
            {isLoading && !isThinking && !isGeneratingImage && !isGeneratingVideo &&(
                <div className="pl-12 mt-4 animate-fade-in">
                    <div className="inline-flex items-center space-x-3 text-gray-400 p-2 bg-gray-800/50 rounded-lg">
                      <SparklesIcon className="w-5 h-5 text-cyan-400 animate-pulse-icon" />
                      <span className="text-sm font-medium">Generating response & suggestions...</span>
                    </div>
                </div>
            )}
            {(suggestedPrompts.length > 0 || relatedTopics.length > 0) && !isLoading && (
              <div className="pl-12 animate-fade-in mt-4 space-y-5">
                {suggestedPrompts.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-400 mb-2">Next questions</p>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {suggestedPrompts.map((prompt, index) => (
                        <button
                          key={`suggestion-${index}`}
                          onClick={() => handleSendMessage(prompt)}
                          className="text-xs sm:text-sm bg-gray-800/60 backdrop-blur-sm hover:bg-gray-700/60 border border-gray-700 text-gray-300 hover:text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all duration-200"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                 {relatedTopics.length > 0 && (
                    <div>
                        <p className="text-sm font-semibold text-gray-400 mb-2">Explore related</p>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            {relatedTopics.map((topic, index) => (
                                <button
                                    key={`topic-${index}`}
                                    onClick={() => handleSendMessage(topic)}
                                    className="text-xs sm:text-sm bg-gray-800/60 backdrop-blur-sm hover:bg-gray-700/60 border border-gray-700 text-gray-300 hover:text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all duration-200"
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
                      className="text-xs sm:text-sm bg-gray-800/60 backdrop-blur-sm hover:bg-gray-700/60 border border-gray-700 text-gray-300 hover:text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all duration-200"
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

      <footer className="p-2 sm:p-4 md:p-6 border-t border-gray-700 bg-gray-900/80 backdrop-blur-sm">
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          aria-labelledby="summary-modal-title"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowSummaryModal(false)}
        >
          <div
            className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-md sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <header className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <SparklesIcon className="w-6 h-6 text-cyan-400" />
                <h2 id="summary-modal-title" className="text-lg font-semibold text-white">
                  Conversation Summary
                </h2>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="p-1.5 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                aria-label="Close summary"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </header>
    
            <main className="p-6 overflow-y-auto prose prose-invert max-w-none">
              {isSummarizing ? (
                <div className="flex flex-col items-center justify-center text-gray-400 space-y-3">
                  <SparklesIcon className="w-10 h-10 text-cyan-400 animate-pulse-icon" />
                  <p>Generating summary...</p>
                </div>
              ) : (
                <p>{summaryText}</p>
              )}
            </main>
    
            <footer className="flex items-center justify-end p-4 border-t border-gray-700 bg-gray-800/50">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="px-4 py-2 rounded-md text-gray-300 bg-gray-700/80 hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleCopySummary}
                  disabled={isSummarizing || !summaryText}
                  className="px-4 py-2 rounded-md text-white bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
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
    </div>
  );
};

export default App;