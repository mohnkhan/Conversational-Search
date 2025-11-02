
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getGeminiResponse } from './services/geminiService';
import { ChatMessage as ChatMessageType, Source } from './types';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { BotIcon, SearchIcon, TrashIcon } from './components/Icons';

const initialMessages: ChatMessageType[] = [
  {
    role: 'model',
    text: "Hello! I'm a conversational search assistant powered by Gemini. Ask me anything, and I'll use Google Search to find the most up-to-date information for you.",
    sources: []
  }
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>(initialMessages);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = useCallback(async (inputText: string) => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessageType = { role: 'user', text: inputText };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);

    try {
      const { text, sources } = await getGeminiResponse(inputText);
      const modelMessage: ChatMessageType = { role: 'model', text, sources };
      setMessages(prevMessages => [...prevMessages, modelMessage]);
    } catch (error) {
      console.error("Failed to get Gemini response:", error);
      const errorMessage: ChatMessageType = {
        role: 'model',
        text: 'Sorry, I encountered an error. Please try again.',
        sources: []
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleClearChat = () => {
    setMessages(initialMessages);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center">
            <BotIcon className="w-8 h-8 text-cyan-400 mr-3" />
            <div>
            <h1 className="text-xl font-bold text-white">Gemini Conversational Search</h1>
            <p className="text-sm text-gray-400 flex items-center">
                <SearchIcon className="w-4 h-4 mr-1.5" />
                <span>Powered by Google Search Grounding</span>
            </p>
            </div>
        </div>
        <button
          onClick={handleClearChat}
          className="p-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200"
          aria-label="Clear chat history"
          title="Clear chat"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="max-w-4xl mx-auto w-full">
            {messages.map((msg, index) => (
                <ChatMessage key={index} message={msg} />
            ))}
            {isLoading && (
                <div className="flex items-center space-x-3 animate-pulse p-4">
                    <div className="flex-shrink-0">
                        <BotIcon className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div className="w-full space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-4 md:p-6 border-t border-gray-700 bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </footer>
    </div>
  );
};

export default App;
