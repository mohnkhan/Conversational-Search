
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage as ChatMessageType } from '../types';
import { BotIcon, UserIcon, LinkIcon } from './Icons';
import SourceLink from './SourceLink';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === 'model';

  return (
    <div className={`flex items-start space-x-4 p-4 my-2 animate-fade-in`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isModel ? 'bg-cyan-500/20' : 'bg-indigo-500/20'}`}>
        {isModel ? <BotIcon className="w-5 h-5 text-cyan-400" /> : <UserIcon className="w-5 h-5 text-indigo-400" />}
      </div>
      <div className="flex-1">
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
            <h4 className="text-sm font-semibold text-gray-400 flex items-center mb-2">
              <LinkIcon className="w-4 h-4 mr-2" />
              Sources
            </h4>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, index) => 
                source.web ? <SourceLink key={index} source={source.web} /> : null
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
