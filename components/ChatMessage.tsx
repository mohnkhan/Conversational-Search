import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage as ChatMessageType, ResearchScope } from '../types';
import { BotIcon, UserIcon, CopyIcon, CheckIcon, ErrorIcon, ShareIcon, ThumbsUpIcon, ThumbsDownIcon, DownloadIcon, ZoomInIcon, RefreshCwIcon, FileTextIcon, SparklesIcon } from './Icons';
import Sources from './Sources';
import CodeBlock from './CodeBlock'; // Use the shared CodeBlock component

interface ChatMessageProps {
  message: ChatMessageType;
  messageIndex: number;
  onFeedback: (index: number, feedback: 'up' | 'down') => void;
  onImageClick: (url: string) => void;
  onRetry: (prompt: string) => void;
}

const thinkingSteps = [
    "Analyzing your request...",
    "Consulting knowledge sources...",
    "Formulating a response...",
    "Cross-referencing information...",
    "Drafting the answer...",
];

const formatScopeName = (scope: ResearchScope): string => {
    const names: Record<ResearchScope, string> = {
        'comprehensive': 'Comprehensive Analysis',
        'pros-cons': 'Pros & Cons',
        'historical': 'Historical Context',
        'compare-contrast': 'Compare & Contrast',
        'technical': 'Technical Deep-Dive',
    };
    return names[scope];
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, messageIndex, onFeedback, onImageClick, onRetry }) => {
  const isModel = message.role === 'model';
  const [isCopied, setIsCopied] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [currentThinkingStep, setCurrentThinkingStep] = useState(thinkingSteps[0]);
  // FIX: Added state to handle video URL which might be a Blob object, to satisfy type-checker and ensure it's a string URL.
  const [videoSrc, setVideoSrc] = useState<string>('');

  useEffect(() => {
    let objectUrl: string | undefined;
    if (message.videoUrl) {
      if (typeof message.videoUrl === 'string') {
        setVideoSrc(message.videoUrl);
      } else {
        // This path is taken if the type is not a string, presumably a Blob.
        try {
          objectUrl = URL.createObjectURL(message.videoUrl as unknown as Blob);
          setVideoSrc(objectUrl);
        } catch (e) {
          console.error("Failed to create object URL from videoUrl:", e);
          setVideoError(true);
        }
      }
    } else {
        setVideoSrc('');
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [message.videoUrl]);

  useEffect(() => {
    let intervalId: number | undefined;
    if (message.isThinking) {
      setCurrentThinkingStep(thinkingSteps[0]); // Reset to first step
      intervalId = window.setInterval(() => {
        setCurrentThinkingStep(prevStep => {
          const currentIndex = thinkingSteps.indexOf(prevStep);
          const nextIndex = (currentIndex + 1) % thinkingSteps.length;
          return thinkingSteps[nextIndex];
        });
      }, 1800); // Change text every 1.8 seconds
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [message.isThinking]);

  if (message.isThinking) {
    return (
        <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 my-2 animate-fade-in" role="status" aria-live="polite">
            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-[var(--bg-accent-translucent)]">
                <BotIcon className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div className="flex-1 pt-1.5 sm:pt-2">
                <div className="flex items-center space-x-2">
                    <p className="font-medium text-[var(--text-muted)] italic">{currentThinkingStep}</p>
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
  }

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
      <div className="relative flex-shrink-0">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${getIconBgColor()}`}>
              {getIcon()}
          </div>
          {message.role === 'user' && message.researchScope && (
              <div className="absolute -bottom-1 -right-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-0.5 rounded-full shadow-md" title={`Sent with Deep Research: ${formatScopeName(message.researchScope)}`}>
                  <SparklesIcon className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              </div>
          )}
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
                            href={videoSrc}
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
                            src={videoSrc} 
                            controls 
                            autoPlay 
                            muted 
                            loop
                            className="rounded-lg border border-[var(--border-color)] max-w-full h-auto"
                            onError={() => setVideoError(true)}
                        />
                        <a
                            href={videoSrc}
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
                {message.role === 'user' && message.attachment && (
                    <div className="mb-2 border border-[var(--border-color)] bg-[var(--bg-secondary)] p-2 rounded-lg inline-flex items-center space-x-2 max-w-xs">
                        {message.attachment.type.startsWith('image/') ? (
                            <img src={message.attachment.dataUrl} alt={message.attachment.name} className="w-10 h-10 rounded object-cover" />
                        ) : (
                            <div className="w-10 h-10 flex items-center justify-center bg-[var(--bg-primary)] rounded flex-shrink-0">
                                <FileTextIcon className="w-6 h-6 text-[var(--text-muted)]" />
                            </div>
                        )}
                        <div className="text-sm overflow-hidden">
                            <p className="font-medium text-[var(--text-primary)] truncate">{message.attachment.name}</p>
                            <p className="text-xs text-[var(--text-muted)]">{Math.round(message.attachment.size / 1024)} KB</p>
                        </div>
                    </div>
                )}
                <div className={`prose prose-themed max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 md:pr-40`}>
                {message.isError ? (
                    <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 not-prose">
                        <p className="font-semibold text-red-100">An Error Occurred</p>
                        <p className="text-red-200 mt-1 text-sm">{message.text}</p>
                        {message.originalText && (
                            <button
                                onClick={() => onRetry(message.originalText!)}
                                className="mt-3 flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-red-600/80 hover:bg-red-500/80 transition-colors"
                                title="Retry failed prompt"
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
                        img: ({node, ...props}) => (
                            <button
                                onClick={() => props.src && onImageClick(props.src)}
                                className="block my-2 w-full max-w-sm cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] rounded-md text-left"
                                aria-label={`View larger image: ${props.alt}`}
                            >
                                <img {...props} alt={props.alt || 'Embedded image'} className="max-w-full h-auto rounded-md border border-[var(--border-color)]" />
                            </button>
                        ),
                        table: ({node, ...props}) => (
                            <div className="overflow-x-auto my-4 border border-[var(--border-color)] rounded-lg not-prose">
                              <table className="w-full text-sm" {...props} />
                            </div>
                          ),
                        thead: ({node, ...props}) => <thead className="bg-[var(--bg-secondary)]/60" {...props} />,
                        th: ({node, ...props}) => <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]" {...props} />,
                        tr: ({node, ...props}) => <tr className="border-b border-[var(--border-color)] last:border-b-0 even:bg-[var(--bg-secondary)]/40" {...props} />,
                        td: ({node, ...props}) => <td className="px-4 py-3" {...props} />,
                    }}
                    >
                    {message.text}
                    </ReactMarkdown>
                )}
                </div>
                
                {isModel && !message.isError && message.sources && message.sources.length > 0 && (
                <div className="mt-4 border-t border-[var(--border-color)] pt-3">
                    <Sources sources={message.sources} />
                </div>
                )}
            </>
        )}
        
        {message.text && !message.isError && (
            <div className="flex items-center space-x-1 md:absolute md:top-0 md:right-0 md:mt-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                {isModel ? (
                    renderActionButtons()
                ) : (
                    <button
                        onClick={handleCopy}
                        className="p-1.5 rounded-md text-[var(--text-muted)] bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                        aria-label="Copy message"
                        title="Copy message"
                    >
                        {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                    </button>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;