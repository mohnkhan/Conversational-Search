import React, { useEffect, useRef, useState } from 'react';
import { XIcon, UsersIcon, TrashIcon, PlusSquareIcon, CheckIcon, LightbulbIcon } from './Icons';
import { Persona } from '../types';

interface PersonaManagerProps {
    onClose: () => void;
    personas: Persona[];
    onSave: (persona: Persona) => void;
    onDelete: (id: string) => void;
}

const PersonaManager: React.FC<PersonaManagerProps> = ({ onClose, personas, onSave, onDelete }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('');
    const [prompt, setPrompt] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    const selectedPersona = personas.find(p => p.id === selectedPersonaId);
    const isDirty = selectedPersona ? (name !== selectedPersona.name || icon !== selectedPersona.icon || prompt !== selectedPersona.prompt) : (name !== '' || icon !== '' || prompt !== '');

    useEffect(() => {
        // Load selected persona into form
        if (selectedPersona) {
            setName(selectedPersona.name);
            setIcon(selectedPersona.icon);
            setPrompt(selectedPersona.prompt);
        } else {
            // If no persona is selected (or selection is cleared), reset form
            setName('');
            setIcon('');
            setPrompt('');
        }
    }, [selectedPersonaId, personas]);

    const handleSave = () => {
        if (!name.trim() || !icon.trim() || !prompt.trim()) {
            alert("All fields are required to save a persona.");
            return;
        }

        const personaToSave: Persona = {
            id: selectedPersonaId || `p-${Date.now().toString()}`,
            name: name.trim(),
            icon: icon.trim(),
            prompt: prompt.trim(),
        };

        onSave(personaToSave);
        if (!selectedPersonaId) {
            setSelectedPersonaId(personaToSave.id); // Select the newly created persona
        }
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };
    
    const handleAddNew = () => {
        setSelectedPersonaId(null);
        setName('');
        setIcon('');
        setPrompt('');
        document.getElementById('persona-name-input')?.focus();
    };
    
    const handleDelete = () => {
        if (selectedPersonaId && confirm(`Are you sure you want to delete the "${name}" persona?`)) {
            onDelete(selectedPersonaId);
            setSelectedPersonaId(null);
        }
    };
    
    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
            aria-labelledby="persona-manager-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl w-full max-w-4xl flex flex-col h-[85vh]"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-[var(--border-color)] flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <UsersIcon className="w-6 h-6 text-[var(--accent-primary)]" />
                        <h2 id="persona-manager-title" className="text-lg font-semibold text-[var(--text-primary)]">
                            Persona Manager
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                        aria-label="Close persona manager"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <aside className="w-1/3 border-r border-[var(--border-color)] flex flex-col">
                        <div className="p-3">
                            <button
                                onClick={handleAddNew}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-semibold text-white bg-[var(--accent-primary)] hover:opacity-90 transition-all"
                            >
                                <PlusSquareIcon className="w-4 h-4" />
                                <span>New Persona</span>
                            </button>
                        </div>
                        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                            {personas.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPersonaId(p.id)}
                                    className={`w-full text-left flex items-center space-x-3 p-2 rounded-md transition-colors ${
                                        selectedPersonaId === p.id ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                                    }`}
                                >
                                    <span className="text-xl">{p.icon}</span>
                                    <span className="flex-1 font-medium truncate">{p.name}</span>
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Main Editor */}
                    <main className="w-2/3 flex flex-col">
                        {selectedPersonaId === null && !name && !prompt ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <UsersIcon className="w-16 h-16 text-[var(--bg-tertiary)]" />
                                <h3 className="mt-4 text-lg font-semibold text-[var(--text-secondary)]">Select a persona to edit</h3>
                                <p className="mt-1 text-sm text-[var(--text-muted)]">...or create a new one to get started!</p>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">{selectedPersonaId ? 'Edit Persona' : 'Create New Persona'}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="md:col-span-2">
                                        <label htmlFor="persona-name-input" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Name</label>
                                        <input
                                            id="persona-name-input"
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="e.g., Creative Writer"
                                            className="w-full bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="persona-icon-input" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Icon (Emoji)</label>
                                        <input
                                            id="persona-icon-input"
                                            type="text"
                                            value={icon}
                                            onChange={e => setIcon(e.target.value)}
                                            placeholder="✍️"
                                            maxLength={2}
                                            className="w-full bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] text-center"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <label htmlFor="persona-prompt-input" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">System Prompt</label>
                                    <textarea
                                        id="persona-prompt-input"
                                        value={prompt}
                                        onChange={e => setPrompt(e.target.value)}
                                        placeholder="You are a helpful assistant that..."
                                        className="w-full flex-1 bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono text-xs border border-[var(--border-color)] rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] resize-none"
                                        spellCheck="false"
                                    />
                                </div>
                                <div className="mt-4 p-3 bg-[var(--bg-primary)] rounded-md border border-[var(--border-color)] flex items-start space-x-2">
                                    <LightbulbIcon className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-[var(--text-muted)]">
                                        A good prompt is clear and specific. Define the AI's role, tone, and any constraints or rules it should follow.
                                    </p>
                                </div>
                            </div>
                        )}
                        <footer className="flex items-center justify-between p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50 flex-shrink-0">
                            <button
                                onClick={handleDelete}
                                disabled={!selectedPersonaId}
                                className="px-4 py-2 rounded-md text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)]/80 hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-danger)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                            >
                                <TrashIcon className="w-4 h-4" />
                                <span>Delete</span>
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!isDirty || !name.trim() || !icon.trim() || !prompt.trim()}
                                className="px-5 py-2 rounded-md text-sm font-semibold text-white bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
                            >
                                {isSaved ? <CheckIcon className="w-4 h-4" /> : null}
                                <span>{isSaved ? 'Saved!' : 'Save Persona'}</span>
                            </button>
                        </footer>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default PersonaManager;