import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage as ChatMessageType } from '../types';
import { BotIcon, UserIcon, CopyIcon, CheckIcon, ErrorIcon, ShareIcon, ThumbsUpIcon, ThumbsDownIcon, DownloadIcon } from './Icons';
import Sources from './Sources';

interface ChatMessageProps {
  message: ChatMessageType;
  messageIndex: number;
  onFeedback: (index: number, feedback: 'up' | 'down') => void;
}

const CodeBlock: React.FC<any> = ({ node, inline, className, children, ...props }) => {
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';
  const codeText = String(children).replace(/\n$/, '');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeText).then(() => {
      setIsCodeCopied(true);
      setTimeout(() => setIsCodeCopied(false), 2000);
    }).catch(err => {
      console.error("Failed to copy code:", err);
    });
  };

  if (!inline && match) {
    return (
      <div className="bg-gray-900/70 rounded-lg my-4 border border-gray-700 overflow-hidden not-prose">
        <div className="flex items-center justify-between bg-gray-800/80 px-4 py-2 text-xs text-gray-400">
          <span>{language}</span>
          <button onClick={handleCopyCode} className="flex items-center space-x-1.5 hover:text-white transition-colors text-xs">
            {isCodeCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
            <span>{isCodeCopied ? 'Copied!' : 'Copy code'}</span>
          </button>
        </div>
        <pre className="p-4 text-sm overflow-x-auto font-mono">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  }
  
  return (
    <code className="bg-gray-700/50 text-cyan-300 rounded-sm px-1.5 py-0.5 font-mono text-sm mx-0.5 not-prose" {...props}>
      {children}
    </code>
  );
};


const ChatMessage: React.FC<ChatMessageProps> = ({ message, messageIndex, onFeedback }) => {
  const isModel = message.role === 'model';
  const [isCopied, setIsCopied] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const handleCopy = () => {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Revert icon after 2 seconds
    }).catch(err => {
      console.error("Failed to copy text:", err);
    });
  };

  const handleShare = () => {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text).then(() => {
      setIsShared(true);
      setTimeout(() => setIsShared(false), 2000);
    }).catch(err => {
        console.error("Failed to copy text for sharing:", err);
    });
  };

  const getIcon = () => {
    if (isModel) {
        return message.isError 
            ? <ErrorIcon className="w-5 h-5 text-red-400" /> 
            : <BotIcon className="w-5 h-5 text-cyan-400" />;
    }
    return <UserIcon className="w-5 h-5 text-indigo-400" />;
  };

  const getIconBgColor = () => {
    if (isModel) {
        return message.isError ? 'bg-red-500/20' : 'bg-cyan-500/20';
    }
    return 'bg-indigo-500/20';
  };

  const renderActionButtons = () => (
    <>
        <button
            onClick={() => onFeedback(messageIndex, 'up')}
            className={`p-1.5 rounded-md text-gray-400 bg-gray-800/50 hover:bg-gray-700 transition-colors duration-200 ${
                message.feedback === 'up' ? 'text-green-400 hover:text-green-300' : 'hover:text-white'
            }`}
            aria-pressed={message.feedback === 'up'}
            aria-label="Good response"
            title="Good response"
        >
            <ThumbsUpIcon className={`w-4 h-4 ${message.feedback === 'up' ? 'fill-current' : ''}`} />
        </button>
        <button
            onClick={() => onFeedback(messageIndex, 'down')}
            className={`p-1.5 rounded-md text-gray-400 bg-gray-800/50 hover:bg-gray-700 transition-colors duration-200 ${
                message.feedback === 'down' ? 'text-red-400 hover:text-red-300' : 'hover:text-white'
            }`}
            aria-pressed={message.feedback === 'down'}
            aria-label="Bad response"
            title="Bad response"
        >
            <ThumbsDownIcon className={`w-4 h-4 ${message.feedback === 'down' ? 'fill-current' : ''}`} />
        </button>

        <div className="h-4 w-px bg-gray-600 mx-1"></div>
        
        <button
          onClick={handleShare}
          className="p-1.5 rounded-md text-gray-400 bg-gray-800/50 hover:bg-gray-700 hover:text-white transition-colors duration-200"
          aria-label="Share message"
          title="Share message"
        >
          {isShared ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ShareIcon className="w-4 h-4" />}
        </button>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md text-gray-400 bg-gray-800/50 hover:bg-gray-700 hover:text-white transition-colors duration-200"
          aria-label="Copy message"
          title="Copy message"
        >
          {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
        </button>
    </>
  );

  return (
    <div className={`flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 my-2 animate-fade-in`}>
      <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${getIconBgColor()}`}>
        {getIcon()}
      </div>
      <div className="flex-1 group relative">
        {message.imageUrl ? (
            <div>
                <p className="text-gray-400 italic text-sm mb-2">Image generated for: "{message.text}"</p>
                <div className="relative group/image inline-block">
                    <img src={message.imageUrl} alt={message.text} className="rounded-lg border border-gray-700 max-w-full h-auto" />
                    <a
                        href={message.imageUrl}
                        download={`gemini-generated-image-${new Date().getTime()}.png`}
                        className="absolute bottom-3 right-3 bg-gray-900/70 text-white p-2 rounded-full opacity-0 group-hover/image:opacity-100 focus:opacity-100 transition-opacity"
                        aria-label="Download image"
                        title="Download image"
                    >
                        <DownloadIcon className="w-5 h-5" />
                    </a>
                </div>
            </div>
        ) : (
            <>
                <div className={`prose prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-li:my-1 prose-a:text-cyan-400 hover:prose-a:text-cyan-300 ${isModel ? 'text-gray-200' : 'text-gray-100'}`}>
                {message.isError ? (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 not-prose">
                    <p className="font-semibold text-red-300">An Error Occurred</p>
                    <p className="text-red-300/90 mt-1 text-sm">{message.text}</p>
                    </div>
                ) : (
                    <ReactMarkdown
                    components={{
                        a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                        code: CodeBlock,
                    }}
                    >
                    {message.text}
                    </ReactMarkdown>
                )}
                </div>
                
                {isModel && !message.isError && (
                    <div className="mt-3 flex items-center space-x-1 md:absolute md:top-0 md:right-0 md:mt-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                        {renderActionButtons()}
                    </div>
                )}

                {isModel && !message.isError && message.sources && message.sources.length > 0 && (
                <div className="mt-4 border-t border-gray-700 pt-3">
                    <Sources sources={message.sources} />
                </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;