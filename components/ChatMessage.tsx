import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';
import { ChatMessage as ChatMessageType } from '../types';
import { BotIcon, UserIcon, CopyIcon, CheckIcon, ErrorIcon, ShareIcon, ThumbsUpIcon, ThumbsDownIcon, DownloadIcon, ZoomInIcon, RefreshCwIcon } from './Icons';
import Sources from './Sources';

interface ChatMessageProps {
  message: ChatMessageType;
  messageIndex: number;
  onFeedback: (index: number, feedback: 'up' | 'down') => void;
  onImageClick: (url: string) => void;
  onRetry: (prompt: string) => void;
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
      <div className="bg-[#1e1e1e] rounded-lg my-4 border border-[var(--border-color)] overflow-hidden not-prose relative font-mono text-sm">
        <div className="flex items-center justify-between bg-black/20 px-4 py-2 text-xs text-gray-400">
          <span>{language}</span>
          <button onClick={handleCopyCode} className="flex items-center space-x-1.5 hover:text-white transition-colors text-xs">
            {isCodeCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
            <span>{isCodeCopied ? 'Copied!' : 'Copy code'}</span>
          </button>
        </div>
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: '1rem',
            backgroundColor: 'transparent',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'inherit',
              fontSize: '0.9rem',
            }
          }}
          {...props}
        >
          {codeText}
        </SyntaxHighlighter>
      </div>
    );
  }
  
  return (
    <code className="text-[var(--accent-secondary)] font-mono text-sm bg-[var(--bg-secondary)]/80 px-1 py-0.5 rounded not-prose" {...props}>
      {children}
    </code>
  );
};


const ChatMessage: React.FC<ChatMessageProps> = ({ message, messageIndex, onFeedback, onImageClick, onRetry }) => {
  const isModel = message.role === 'model';
  const [isCopied, setIsCopied] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [videoError, setVideoError] = useState(false);

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
            ? <ErrorIcon className="w-5 h-5 text-[var(--accent-danger)]" /> 
            : <BotIcon className="w-5 h-5 text-[var(--accent-primary)]" />;
    }
    return <UserIcon className="w-5 h-5 text-indigo-400" />;
  };

  const getIconBgColor = () => {
    if (isModel) {
        return message.isError ? 'bg-red-500/20' : 'bg-[var(--bg-accent-translucent)]';
    }
    return 'bg-indigo-500/20';
  };

  const renderActionButtons = () => (
    <>
        <button
            onClick={() => onFeedback(messageIndex, 'up')}
            className={`p-1.5 rounded-md text-[var(--text-muted)] bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] transition-colors duration-200 ${
                message.feedback === 'up' ? 'text-green-400 hover:text-green-300' : 'hover:text-[var(--text-primary)]'
            }`}
            aria-pressed={message.feedback === 'up'}
            aria-label="Good response"
            title="Good response"
        >
            <ThumbsUpIcon className={`w-4 h-4 ${message.feedback === 'up' ? 'fill-current' : ''}`} />
        </button>
        <button
            onClick={() => onFeedback(messageIndex, 'down')}
            className={`p-1.5 rounded-md text-[var(--text-muted)] bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] transition-colors duration-200 ${
                message.feedback === 'down' ? 'text-red-400 hover:text-red-300' : 'hover:text-[var(--text-primary)]'
            }`}
            aria-pressed={message.feedback === 'down'}
            aria-label="Bad response"
            title="Bad response"
        >
            <ThumbsDownIcon className={`w-4 h-4 ${message.feedback === 'down' ? 'fill-current' : ''}`} />
        </button>

        <div className="h-4 w-px bg-[var(--border-color)] mx-1"></div>
        
        <button
          onClick={handleShare}
          className="p-1.5 rounded-md text-[var(--text-muted)] bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200"
          aria-label="Share message"
          title="Share message"
        >
          {isShared ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ShareIcon className="w-4 h-4" />}
        </button>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md text-[var(--text-muted)] bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200"
          aria-label="Copy message"
          title="Copy message"
        >
          {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
        </button>
        {message.imageUrl && (
            <a
                href={message.imageUrl}
                download={`gemini-generated-image.png`}
                className="p-1.5 rounded-md text-[var(--text-muted)] bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                aria-label="Download image"
                title="Download image"
            >
                <DownloadIcon className="w-4 h-4" />
            </a>
        )}
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
                <p className="text-[var(--text-muted)] italic text-sm mb-2">Image generated for: "{message.text}"</p>
                <button
                    onClick={() => onImageClick(message.imageUrl!)}
                    className="relative group/image inline-block cursor-zoom-in text-left focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] rounded-lg"
                    aria-label={`View larger image for prompt: ${message.text}`}
                >
                    <img src={message.imageUrl} alt={message.text} className="rounded-lg border border-[var(--border-color)] max-w-full h-auto block" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/image:opacity-100 group-focus/image:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <ZoomInIcon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute bottom-3 right-3 flex items-center space-x-2 opacity-0 group-hover/image:opacity-100 group-focus-within/image:opacity-100 transition-opacity">
                        <a
                            href={message.imageUrl}
                            download={`gemini-generated-image.png`}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition-colors focus:opacity-100"
                            aria-label="Download image"
                            title="Download image"
                        >
                            <DownloadIcon className="w-5 h-5" />
                        </a>
                    </div>
                </button>
            </div>
        ) : message.videoUrl ? (
            <div>
                 <p className="text-[var(--text-muted)] italic text-sm mb-2">Video created for: "{message.text}"</p>
                 {videoError ? (
                    <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 flex flex-col items-center justify-center aspect-video max-w-sm text-center">
                        <ErrorIcon className="w-8 h-8 text-red-400 mb-2" />
                        <p className="text-sm text-red-200 mb-3">Video failed to load or play.</p>
                        <a
                            href={message.videoUrl}
                            download={`gemini-generated-video.mp4`}
                            className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-red-600/80 hover:bg-red-500/80 transition-colors"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            <span>Download Video</span>
                        </a>
                    </div>
                 ) : (
                    <div className="relative group/video inline-block aspect-video">
                        <video 
                            src={message.videoUrl} 
                            controls 
                            autoPlay 
                            muted 
                            loop
                            className="rounded-lg border border-[var(--border-color)] max-w-full h-auto"
                            onError={() => setVideoError(true)}
                        />
                        <a
                            href={message.videoUrl}
                            download={`gemini-generated-video.mp4`}
                            className="absolute bottom-3 right-3 bg-black/70 text-white p-2 rounded-full opacity-0 group-hover/video:opacity-100 focus:opacity-100 transition-opacity"
                            aria-label="Download video"
                            title="Download video"
                        >
                            <DownloadIcon className="w-5 h-5" />
                        </a>
                    </div>
                 )}
            </div>
        ) : (
            <>
                <div className={`prose prose-themed max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 md:pr-40`}>
                {message.isError ? (
                    <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 not-prose">
                        <p className="font-semibold text-red-100">An Error Occurred</p>
                        <p className="text-red-200 mt-1 text-sm">{message.text}</p>
                        {message.originalText && (
                            <button
                                onClick={() => onRetry(message.originalText!)}
                                className="mt-3 flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-red-600/80 hover:bg-red-500/80 transition-colors"
                            >
                                <RefreshCwIcon className="w-4 h-4" />
                                <span>Retry</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                        code: CodeBlock,
                        table: ({node, ...props}) => (
                            <div className="overflow-x-auto my-4 border border-[var(--border-color)] rounded-lg not-prose">
                              <table className="w-full text-sm" {...props} />
                            </div>
                          ),
                        thead: ({node, ...props}) => <thead className="bg-[var(--bg-secondary)]" {...props} />,
                        th: ({node, ...props}) => <th className="px-4 py-3 text-left font-bold text-[var(--text-secondary)] border-r border-[var(--border-color)] last:border-r-0" {...props} />,
                        tr: ({node, ...props}) => <tr className="border-b border-[var(--border-color)] last:border-b-0 even:bg-[var(--bg-secondary)]/40" {...props} />,
                        td: ({node, ...props}) => <td className="px-4 py-3 border-r border-[var(--border-color)] last:border-r-0" {...props} />,
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
                <div className="mt-4 border-t border-[var(--border-color)] pt-3">
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