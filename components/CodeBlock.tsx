import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';
import { CopyIcon, CheckIcon } from './Icons';

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
      <div className="bg-[var(--bg-secondary)] rounded-lg my-4 border border-[var(--border-color)] overflow-hidden not-prose relative font-mono text-sm">
        <div className="flex items-center justify-between bg-[var(--bg-tertiary)]/40 px-4 py-2 text-xs text-[var(--text-muted)]">
          <span>{language}</span>
          <button onClick={handleCopyCode} className="flex items-center space-x-1.5 hover:text-[var(--text-primary)] transition-colors text-xs">
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

export default CodeBlock;