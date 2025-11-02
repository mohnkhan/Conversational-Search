import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { themes } from '../themes';
import { CheckIcon } from './Icons';

interface ThemeSelectorProps {
    onClose: () => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onClose }) => {
    const [themeId, setThemeId] = useTheme();

    const handleThemeChange = (id: string) => {
        setThemeId(id);
        onClose();
    };
    
    return (
        <div 
            className="absolute top-full mt-2 right-0 w-48 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl z-30 animate-fade-in"
            style={{ animationDuration: '0.2s' }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className="p-2">
                <p className="px-2 py-1 text-xs font-semibold text-[var(--text-muted)]">Select Theme</p>
                {themes.map((theme) => (
                    <button
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id)}
                        className={`w-full text-left flex items-center justify-between px-2 py-1.5 text-sm rounded-md transition-colors ${
                            themeId === theme.id 
                            ? 'bg-[var(--accent-primary)] text-white' 
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        <span>{theme.name}</span>
                        {themeId === theme.id && <CheckIcon className="w-4 h-4" />}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ThemeSelector;