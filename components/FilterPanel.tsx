import React, { useState, useEffect, useRef } from 'react';
import { DateFilter, PredefinedDateFilter, CustomDateFilter } from '../types';

type FilterMode = PredefinedDateFilter | 'custom';

interface FilterPanelProps {
    activeFilter: DateFilter;
    onApplyFilter: (filter: DateFilter) => void;
    onClose: () => void;
}

const presetOptions: { key: PredefinedDateFilter, label: string }[] = [
    { key: 'any', label: 'Any time' },
    { key: 'day', label: 'Past 24 hours' },
    { key: 'week', label: 'Past week' },
    { key: 'month', label: 'Past month' },
    { key: 'year', label: 'Past year' },
];

const FilterPanel: React.FC<FilterPanelProps> = ({ activeFilter, onApplyFilter, onClose }) => {
    const [mode, setMode] = useState<FilterMode>('any');
    const [customDates, setCustomDates] = useState<CustomDateFilter>({ startDate: null, endDate: null });
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof activeFilter === 'string') {
            setMode(activeFilter);
            setCustomDates({ startDate: null, endDate: null });
        } else {
            setMode('custom');
            setCustomDates(activeFilter);
        }
    }, [activeFilter]);

    // Focus trap and Escape key handler
    useEffect(() => {
        const panelElement = panelRef.current;
        if (!panelElement) return;

        const focusableElements = panelElement.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        firstElement.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
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

        // The Escape key listener is handled by ChatInput.tsx to manage focus return correctly.
        panelElement.addEventListener('keydown', handleKeyDown);
        return () => {
            panelElement.removeEventListener('keydown', handleKeyDown);
        };
    }, []);


    const handleModeChange = (newMode: FilterMode) => {
        setMode(newMode);
        if (newMode !== 'custom') {
            setCustomDates({ startDate: null, endDate: null });
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, part: 'startDate' | 'endDate') => {
        setMode('custom');
        setCustomDates(prev => ({ ...prev, [part]: e.target.value || null }));
    };

    const handleApply = () => {
        if (mode === 'custom') {
            onApplyFilter(customDates);
        } else {
            onApplyFilter(mode);
        }
    };

    const handleClear = () => {
        setMode('any');
        setCustomDates({ startDate: null, endDate: null });
        onApplyFilter('any');
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div 
            ref={panelRef}
            className="absolute bottom-full mb-2 w-full sm:w-[400px] right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 animate-fade-in"
            style={{ animationDuration: '0.2s' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-panel-title"
        >
            <div className="p-4 space-y-4">
                <div>
                    <h2 id="filter-panel-title" className="text-base font-semibold text-gray-200 mb-3">
                        Filter by date
                    </h2>
                    <p className="text-sm font-semibold text-gray-300 mb-2">Quick filters</p>
                    <div className="grid grid-cols-2 gap-2">
                        {presetOptions.map(option => (
                        <button
                            key={option.key}
                            onClick={() => handleModeChange(option.key)}
                            className={`w-full text-center text-sm px-3 py-2 rounded-md transition-colors duration-200 ${
                            mode === option.key 
                                ? 'bg-cyan-600 text-white' 
                                : 'text-gray-300 bg-gray-700/60 hover:bg-gray-700'
                            }`}
                        >
                            {option.label}
                        </button>
                        ))}
                    </div>
                </div>

                <div className="border-t border-gray-700 my-4"></div>

                <div>
                    <p className="text-sm font-semibold text-gray-300 mb-2">Custom date range</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       <div>
                            <label htmlFor="start-date" className="block text-xs text-gray-400 mb-1">Start date</label>
                            <input
                                type="date"
                                id="start-date"
                                value={customDates.startDate || ''}
                                onChange={e => handleDateChange(e, 'startDate')}
                                max={customDates.endDate || today}
                                className="w-full text-sm"
                            />
                       </div>
                       <div>
                            <label htmlFor="end-date" className="block text-xs text-gray-400 mb-1">End date</label>
                            <input
                                type="date"
                                id="end-date"
                                value={customDates.endDate || ''}
                                onChange={e => handleDateChange(e, 'endDate')}
                                min={customDates.startDate || ''}
                                max={today}
                                className="w-full text-sm"
                            />
                       </div>
                    </div>
                </div>
            </div>

            <footer className="flex items-center justify-between p-3 border-t border-gray-700 bg-gray-800/50 rounded-b-lg">
                <button
                    onClick={handleClear}
                    className="px-4 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                    Clear Filter
                </button>
                <button
                    onClick={handleApply}
                    className="px-5 py-2 rounded-md text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors"
                >
                    Apply
                </button>
            </footer>
        </div>
    );
};

export default FilterPanel;