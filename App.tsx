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

const examplePrompts = [
    "What are the latest advancements in AI?",
    "Explain quantum computing in simple terms",
    "Who won the last Super Bowl?",
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
  }, [messages, isLoading]);

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
      const errorText = error instanceof Error ? error.message : 'Sorry, an unknown error occurred. Please try again.';
      const errorMessage: ChatMessageType = {
        role: 'model',
        text: errorText,
        sources: [],
        isError: true,
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
             {messages.length === 1 && !isLoading && (
              <div className="pl-12 animate-fade-in -mt-2">
                <div className="flex flex-wrap gap-3">
                  {examplePrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-sm bg-gray-800/60 backdrop-blur-sm hover:bg-gray-700/60 border border-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-full transition-all duration-200"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {isLoading && (
                 <div className="flex items-start space-x-4 p-4 my-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-cyan-500/20">
                        <BotIcon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex items-center space-x-1.5 pt-3">
                        <div className="w-2.5 h-2.5 bg-gray-400 rounded-full dot-bounce dot-1"></div>
                        <div className="w-2.5 h-2.5 bg-gray-400 rounded-full dot-bounce dot-2"></div>
                        <div className="w-2.5 h-2.5 bg-gray-400 rounded-full dot-bounce"></div>
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