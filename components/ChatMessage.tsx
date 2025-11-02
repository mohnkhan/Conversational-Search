import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage as ChatMessageType } from '../types';
import { BotIcon, UserIcon, CopyIcon, CheckIcon } from './Icons';
import Sources from './Sources';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === 'model';
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Revert icon after 2 seconds
    }).catch(err => {
      console.error("Failed to copy text:", err);
    });
  };


  return (
    <div className={`flex items-start space-x-4 p-4 my-2 animate-fade-in`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isModel ? 'bg-cyan-500/20' : 'bg-indigo-500/20'}`}>
        {isModel ? <BotIcon className="w-5 h-5 text-cyan-400" /> : <UserIcon className="w-5 h-5 text-indigo-400" />}
      </div>
      <div className="flex-1 group relative">
        {isModel && (
            <button
              onClick={handleCopy}
              className="absolute top-0 right-0 p-1.5 rounded-md text-gray-400 bg-gray-800/50 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-gray-700 hover:text-white transition-all duration-200"
              aria-label="Copy message"
              title="Copy message"
            >
              {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
            </button>
        )}
        <div className={`prose prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-li:my-1 prose-a:text-cyan-400 hover:prose-a:text-cyan-300 ${isModel ? 'text-gray-200' : 'text-gray-100'}`}>
          <ReactMarkdown
            components={{
              a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />,
            }}
          >
            {message.text}
          </ReactMarkdown>
        </div>
        {isModel && message.sources && message.sources.length > 0 && (
          <div className="mt-4 border-t border-gray-700 pt-3">
            <Sources sources={message.sources} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;