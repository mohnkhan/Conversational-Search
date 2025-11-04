import React, { useState, useRef, useEffect } from 'react';
import { Persona } from '../types';
import { UsersIcon, CheckIcon, PlusSquareIcon, XIcon } from './Icons';

interface PersonaSelectorProps {
    personas: Persona[];
    activePersona: Persona | null;
    onSelectPersona: (persona: Persona | null) => void;
    onOpenManager: () => void;
}

function useOnClickOutside(ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent | TouchEvent) => void) {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler(event);
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
}

const PersonaSelector: React.FC<PersonaSelectorProps> = ({ personas, activePersona, onSelectPersona, onOpenManager }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    useOnClickOutside(wrapperRef, () => setIsOpen(false));

    const handleSelect = (persona: Persona | null) => {
        onSelectPersona(persona);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(p => !p)}
                className="flex items-center space-x-2 text-sm bg-[var(--bg-secondary)]/60 hover:bg-[var(--bg-tertiary)]/60 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-full transition-all duration-200"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                {activePersona ? (
                    <>
                        <span className="text-base">{activePersona.icon}</span>
                        <span className="font-medium">{activePersona.name}</span>
                    </>
                ) : (
                    <>
                        <UsersIcon className="w-4 h-4" />
                        <span className="font-medium">Default Persona</span>
                    </>
                )}
            </button>
            {isOpen && (
                <div 
                    className="absolute bottom-full mb-2 w-64 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl z-20 animate-fade-in p-2"
                    style={{ animationDuration: '0.2s' }}
                >
                    <button
                        onClick={() => handleSelect(null)}
                        className={`w-full text-left flex items-center justify-between p-2 text-sm rounded-md transition-colors ${
                            !activePersona ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                        }`}
                    >
                        <div className="flex items-center space-x-2">
                            <UsersIcon className="w-4 h-4" />
                            <span>Default Persona</span>
                        </div>
                        {!activePersona && <CheckIcon className="w-4 h-4" />}
                    </button>

                    <div className="my-1 h-px bg-[var(--border-color)]/50"></div>

                    <div className="max-h-48 overflow-y-auto">
                        {personas.map(p => (
                            <button
                                key={p.id}
                                onClick={() => handleSelect(p)}
                                className={`w-full text-left flex items-center justify-between p-2 text-sm rounded-md transition-colors ${
                                    activePersona?.id === p.id ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <span>{p.icon}</span>
                                    <span className="truncate">{p.name}</span>
                                </div>
                                {activePersona?.id === p.id && <CheckIcon className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>

                    <div className="my-1 h-px bg-[var(--border-color)]/50"></div>

                    <button
                        onClick={() => { onOpenManager(); setIsOpen(false); }}
                        className="w-full flex items-center space-x-2 p-2 text-sm rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                    >
                        <PlusSquareIcon className="w-4 h-4" />
                        <span>Manage Personas</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default PersonaSelector;