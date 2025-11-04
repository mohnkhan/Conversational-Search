import React, { useEffect, useRef, useState } from 'react';
import { XIcon, KeyIcon, CheckIcon, TrashIcon, RefreshCwIcon } from './Icons';
import { BedrockCredentials } from '../types';

interface ApiKeyManagerProps {
    onClose: () => void;
    onChangeKey: () => void;
    onClearKey: () => void;
    isKeySelected: boolean;
    openAIApiKey: string | null;
    onSaveOpenAIKey: (key: string) => void;
    anthropicApiKey: string | null;
    onSaveAnthropicKey: (key: string) => void;
    bedrockCredentials: BedrockCredentials | null;
    onSaveBedrockCredentials: (creds: BedrockCredentials) => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onClose, onChangeKey, onClearKey, isKeySelected, openAIApiKey, onSaveOpenAIKey, anthropicApiKey, onSaveAnthropicKey, bedrockCredentials, onSaveBedrockCredentials }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [googleMaskedKey, setGoogleMaskedKey] = useState<string>('Checking...');
    const [openAIKeyInput, setOpenAIKeyInput] = useState(openAIApiKey || '');
    const [anthropicKeyInput, setAnthropicKeyInput] = useState(anthropicApiKey || '');
    const [bedrockRegion, setBedrockRegion] = useState(bedrockCredentials?.region || 'us-east-1');
    const [bedrockAccessKey, setBedrockAccessKey] = useState(bedrockCredentials?.accessKeyId || '');
    const [bedrockSecretKey, setBedrockSecretKey] = useState(bedrockCredentials?.secretAccessKey || '');
    const [bedrockSessionToken, setBedrockSessionToken] = useState(bedrockCredentials?.sessionToken || '');

    const [isOAIKeySaved, setIsOAIKeySaved] = useState(false);
    const [isAnthropicKeySaved, setIsAnthropicKeySaved] = useState(false);
    const [isBedrockCredsSaved, setIsBedrockCredsSaved] = useState(false);

    useEffect(() => {
        const modalElement = modalRef.current;
        if (!modalElement) return;

        const focusableElements = modalElement.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        firstElement.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Tab') {
                if (e.shiftKey) { // Shift + Tab
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else { // Tab
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    useEffect(() => {
        setTimeout(() => {
            const key = process.env.API_KEY;
            if (isKeySelected && key) {
                const masked = `${key.substring(0, 5)}...${key.substring(key.length - 4)}`;
                setGoogleMaskedKey(masked);
            } else {
                setGoogleMaskedKey('No key selected');
            }
        }, 0);
    }, [isKeySelected]);

    const handleSaveOpenAI = () => {
        onSaveOpenAIKey(openAIKeyInput.trim());
        setIsOAIKeySaved(true);
        setTimeout(() => setIsOAIKeySaved(false), 2000);
    };
    
    const handleSaveAnthropic = () => {
        onSaveAnthropicKey(anthropicKeyInput.trim());
        setIsAnthropicKeySaved(true);
        setTimeout(() => setIsAnthropicKeySaved(false), 2000);
    };

    const handleSaveBedrock = () => {
        if (!bedrockRegion.trim() || !bedrockAccessKey.trim() || !bedrockSecretKey.trim()) {
            alert("Region, Access Key, and Secret Key are required for AWS Bedrock.");
            return;
        }
        onSaveBedrockCredentials({
            region: bedrockRegion.trim(),
            accessKeyId: bedrockAccessKey.trim(),
            secretAccessKey: bedrockSecretKey.trim(),
            sessionToken: bedrockSessionToken.trim() || undefined,
        });
        setIsBedrockCredsSaved(true);
        setTimeout(() => setIsBedrockCredsSaved(false), 2000);
    };

    const isBedrockDirty = bedrockCredentials?.region !== bedrockRegion ||
                           bedrockCredentials?.accessKeyId !== bedrockAccessKey ||
                           bedrockCredentials?.secretAccessKey !== bedrockSecretKey ||
                           bedrockCredentials?.sessionToken !== bedrockSessionToken;

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
            aria-labelledby="api-key-manager-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl w-full max-w-md flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                    <div className="flex items-center space-x-3">
                        <KeyIcon className="w-6 h-6 text-[var(--accent-primary)]" />
                        <h2 id="api-key-manager-title" className="text-lg font-semibold text-[var(--text-primary)]">
                            API Key Management
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                        aria-label="Close API Key Manager"
                        title="Close"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>

                <main className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Google API Key Section */}
                    <div>
                        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">Google AI</h3>
                        <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-color)]">
                            <p className="text-sm text-[var(--text-muted)]">Current Billed API Key (for Video)</p>
                            <p className="font-mono text-base text-[var(--text-primary)] mt-1 truncate" title={isKeySelected ? "Current active key" : "No key selected"}>
                                {googleMaskedKey}
                            </p>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-2">
                            This key is required for video generation and is managed via the AI Studio environment.
                        </p>
                         <div className="flex items-center space-x-2 mt-3">
                            <button onClick={onChangeKey} className="flex-1 px-4 py-2 rounded-md text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)]/80 hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-center space-x-2">
                                <RefreshCwIcon className="w-4 h-4" />
                                <span>Change Key</span>
                            </button>
                            <button onClick={onClearKey} disabled={!isKeySelected} className="flex-1 px-4 py-2 rounded-md text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)]/80 hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2">
                                <TrashIcon className="w-4 h-4" />
                                <span>Clear Key</span>
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-[var(--border-color)]"></div>

                    {/* AWS Bedrock Section */}
                    <div>
                        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">AWS Bedrock</h3>
                        <div className="space-y-3">
                            <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-color)]">
                                <label htmlFor="bedrock-region" className="text-sm text-[var(--text-muted)]">AWS Region</label>
                                <input id="bedrock-region" type="text" value={bedrockRegion} onChange={(e) => setBedrockRegion(e.target.value)} placeholder="e.g., us-east-1" className="w-full bg-transparent font-mono text-base text-[var(--text-primary)] mt-1 focus:outline-none" />
                            </div>
                             <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-color)]">
                                <label htmlFor="bedrock-access-key" className="text-sm text-[var(--text-muted)]">Access Key ID</label>
                                <input id="bedrock-access-key" type="password" value={bedrockAccessKey} onChange={(e) => setBedrockAccessKey(e.target.value)} placeholder="AKIA..." className="w-full bg-transparent font-mono text-base text-[var(--text-primary)] mt-1 focus:outline-none" />
                            </div>
                             <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-color)]">
                                <label htmlFor="bedrock-secret-key" className="text-sm text-[var(--text-muted)]">Secret Access Key</label>
                                <input id="bedrock-secret-key" type="password" value={bedrockSecretKey} onChange={(e) => setBedrockSecretKey(e.target.value)} placeholder="******************" className="w-full bg-transparent font-mono text-base text-[var(--text-primary)] mt-1 focus:outline-none" />
                            </div>
                            <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-color)]">
                                <label htmlFor="bedrock-session-token" className="text-sm text-[var(--text-muted)]">Session Token (Optional)</label>
                                <input id="bedrock-session-token" type="password" value={bedrockSessionToken} onChange={(e) => setBedrockSessionToken(e.target.value)} placeholder="For temporary credentials" className="w-full bg-transparent font-mono text-base text-[var(--text-primary)] mt-1 focus:outline-none" />
                            </div>
                        </div>
                         <p className="text-xs text-[var(--text-muted)] mt-2">
                           Your credentials are required to use Bedrock models and are stored securely in your browser's local storage.
                        </p>
                        <div className="flex justify-end mt-3">
                             <button onClick={handleSaveBedrock} className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-[var(--accent-primary)] hover:opacity-90 transition-all flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed" disabled={!isBedrockDirty}>
                                {isBedrockCredsSaved ? <CheckIcon className="w-4 h-4" /> : null}
                                <span>{isBedrockCredsSaved ? 'Saved!' : 'Save Bedrock Credentials'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-[var(--border-color)]"></div>

                    {/* OpenAI API Key Section */}
                    <div>
                        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">OpenAI</h3>
                         <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-color)]">
                            <label htmlFor="openai-key-input" className="text-sm text-[var(--text-muted)]">Your OpenAI API Key</label>
                            <input
                                id="openai-key-input"
                                type="password"
                                value={openAIKeyInput}
                                onChange={(e) => setOpenAIKeyInput(e.target.value)}
                                placeholder="sk-..."
                                className="w-full bg-transparent font-mono text-base text-[var(--text-primary)] mt-1 focus:outline-none"
                            />
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-2">
                           Your key is stored securely in your browser's local storage and is never sent anywhere except to OpenAI.
                        </p>
                        <div className="flex justify-end mt-3">
                             <button
                                onClick={handleSaveOpenAI}
                                className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-[var(--accent-primary)] hover:opacity-90 transition-all flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                disabled={openAIKeyInput === openAIApiKey}
                            >
                                {isOAIKeySaved ? <CheckIcon className="w-4 h-4" /> : null}
                                <span>{isOAIKeySaved ? 'Saved!' : 'Save OpenAI Key'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-[var(--border-color)]"></div>

                    {/* Anthropic API Key Section */}
                    <div>
                        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">Anthropic</h3>
                         <div className="bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-color)]">
                            <label htmlFor="anthropic-key-input" className="text-sm text-[var(--text-muted)]">Your Anthropic API Key</label>
                            <input
                                id="anthropic-key-input"
                                type="password"
                                value={anthropicKeyInput}
                                onChange={(e) => setAnthropicKeyInput(e.target.value)}
                                placeholder="sk-ant-..."
                                className="w-full bg-transparent font-mono text-base text-[var(--text-primary)] mt-1 focus:outline-none"
                            />
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-2">
                           Your key is stored securely in your browser's local storage and is never sent anywhere except to Anthropic.
                        </p>
                        <div className="flex justify-end mt-3">
                             <button
                                onClick={handleSaveAnthropic}
                                className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-[var(--accent-primary)] hover:opacity-90 transition-all flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                disabled={anthropicKeyInput === anthropicApiKey}
                            >
                                {isAnthropicKeySaved ? <CheckIcon className="w-4 h-4" /> : null}
                                <span>{isAnthropicKeySaved ? 'Saved!' : 'Save Anthropic Key'}</span>
                            </button>
                        </div>
                    </div>
                </main>

                 <footer className="flex items-center justify-end p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)]/80 hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ApiKeyManager;