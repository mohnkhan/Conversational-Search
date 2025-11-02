import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getGeminiResponseStream, getSuggestedPrompts, getConversationSummary, parseGeminiError } from './services/geminiService';
import { ChatMessage as ChatMessageType, DateFilter } from './types';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { BotIcon, SearchIcon, TrashIcon, ClipboardListIcon, CheckIcon, SparklesIcon, XIcon, CopyIcon } from './components/Icons';

const initialMessages: ChatMessageType[] = [
  {
    role: 'model',
    text: "Hello! I'm a conversational search assistant powered by Gemini. Ask me anything, and I'll use Google Search to find the most up-to-date information for you.",
    sources: []
  }
];

const examplePrompts = [
    "What are the latest advancements in AI?",
    "Explain quantum computing in simple terms",
    "Who won the last Super Bowl?",
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>(initialMessages);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isAllCopied, setIsAllCopied] = useState<boolean>(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [isSummaryCopied, setIsSummaryCopied] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('any');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isThinking, suggestedPrompts]);

  const handleSendMessage = useCallback(async (inputText: string) => {
    if (!inputText.trim() || isLoading) return;
  
    const userMessage: ChatMessageType = { role: 'user', text: inputText };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);
    setIsThinking(true);
    setSuggestedPrompts([]); // Clear previous suggestions
  
    let firstChunkReceived = false;
  
    try {
      const { sources } = await getGeminiResponseStream(
        inputText,
        dateFilter,
        (chunkText) => {
          if (!firstChunkReceived) {
            firstChunkReceived = true;
            setIsThinking(false);
            // First chunk, so create the message
            setMessages(prev => [
              ...prev,
              { role: 'model', text: chunkText, sources: [] }
            ]);
          } else {
            // Subsequent chunks, append to the last message
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              const updatedLastMessage = { ...lastMessage, text: lastMessage.text + chunkText };
              return [...prev.slice(0, -1), updatedLastMessage];
            });
          }
        }
      );
  
      let finalModelResponseText = '';
      // After the stream, update the last message with the final sources
      setMessages(prevMessages => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (lastMessage?.role === 'model') {
            finalModelResponseText = lastMessage.text; // Get the full text
            const updatedLastMessage = { ...lastMessage, sources: sources };
            return [...prevMessages.slice(0, -1), updatedLastMessage];
        }
        return prevMessages;
      });

      // Now, get suggested prompts if we have a response
      if (finalModelResponseText.trim()) {
        try {
            const suggestions = await getSuggestedPrompts(inputText, finalModelResponseText);
            setSuggestedPrompts(suggestions);
        } catch (suggestionError) {
            console.error("Failed to fetch suggested prompts:", suggestionError);
            // Silently fail, don't show an error to the user for this.
        }
      }
  
    } catch (error) {
      console.error("Failed to get Gemini response:", error);
      const errorText = parseGeminiError(error);
      const errorMessage: ChatMessageType = {
        role: 'model',
        text: errorText,
        sources: [],
        isError: true,
      };
      
      setMessages(prev => {
        // If the last message is from the user, the model message hasn't been created yet.
        if (prev[prev.length - 1].role === 'user') {
            return [...prev, errorMessage];
        }
        // Otherwise, the last message is the partial model response, so replace it.
        return [...prev.slice(0, -1), errorMessage];
      });

    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  }, [isLoading, dateFilter]);

  const handleClearChat = () => {
    setMessages(initialMessages);
    setSuggestedPrompts([]);
  };
  
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

  const handleFeedback = (messageIndex: number, feedback: 'up' | 'down') => {
    setMessages(prevMessages => 
      prevMessages.map((msg, index) => {
        if (index === messageIndex) {
          // If the same feedback is clicked again, remove it. Otherwise, set it.
          const newFeedback = msg.feedback === feedback ? undefined : feedback;
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
        const errorText = parseGeminiError(error);
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
      <header className="flex items-center justify-between px-4 py-3 sm:p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
            <BotIcon className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />
            <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">Gemini Conversational Search</h1>
            <p className="text-xs sm:text-sm text-gray-400 flex items-center">
                <SearchIcon className="w-3.5 h-3.5 mr-1.5" />
                <span>Powered by Google Search Grounding</span>
            </p>
            </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
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
              onClick={handleClearChat}
              className="p-1.5 sm:p-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200 flex-shrink-0"
              aria-label="Clear chat history"
              title="Clear chat"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="max-w-4xl mx-auto w-full">
            {messages.map((msg, index) => (
                <ChatMessage 
                  key={index} 
                  message={msg}
                  messageIndex={index}
                  onFeedback={handleFeedback}
                />
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
            {suggestedPrompts.length > 0 && !isLoading && (
              <div className="pl-12 animate-fade-in mt-4">
                <p className="text-sm font-semibold text-gray-400 mb-2">
                    Next questions
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {suggestedPrompts.map((prompt, index) => (
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

      <footer className="p-4 md:p-6 border-t border-gray-700 bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading} 
            activeFilter={dateFilter}
            onFilterChange={setDateFilter}
          />
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
            className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
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
    </div>
  );
};

export default App;