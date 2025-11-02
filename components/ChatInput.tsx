
import React, { useState } from 'react';
import { SendIcon } from './Icons';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2 sm:space-x-3 bg-gray-800 border border-gray-700 rounded-lg p-2 focus-within:ring-2 focus-within:ring-cyan-500 transition-shadow duration-200">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask me anything..."
        className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 focus:outline-none px-2 text-sm sm:text-base"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !text.trim()}
        className="p-2 rounded-md bg-cyan-600 text-white hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
      >
        <SendIcon className="w-5 h-5" />
      </button>
    </form>
  );
};

export default ChatInput;