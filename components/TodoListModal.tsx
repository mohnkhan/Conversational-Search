import React, { useEffect, useRef, useState } from 'react';
import { XIcon, CheckSquareIcon, TrashIcon } from './Icons';
import { Task } from '../types';

interface TodoListModalProps {
    onClose: () => void;
    tasks: Task[];
    onAddTask: (text: string) => void;
    onToggleTask: (id: string) => void;
    onDeleteTask: (id: string) => void;
}

const TodoListModal: React.FC<TodoListModalProps> = ({ onClose, tasks, onAddTask, onToggleTask, onDeleteTask }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [newTaskText, setNewTaskText] = useState('');

    useEffect(() => {
        const modalElement = modalRef.current;
        if (!modalElement) return;

        const focusableElements = modalElement.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        // Focus the text input initially
        const textInput = modalElement.querySelector('input[type="text"]');
        if (textInput) {
            (textInput as HTMLElement).focus();
        } else {
            firstElement.focus();
        }

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

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedText = newTaskText.trim();
        if (trimmedText) {
            onAddTask(trimmedText);
            setNewTaskText('');
        }
    };

    const pendingTasks = tasks.filter(task => !task.completed);
    const completedTasks = tasks.filter(task => task.completed);

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
            aria-labelledby="todo-modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl w-full max-w-lg flex flex-col h-[80vh]"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-[var(--border-color)] flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        <CheckSquareIcon className="w-6 h-6 text-[var(--accent-primary)]" />
                        <h2 id="todo-modal-title" className="text-lg font-semibold text-[var(--text-primary)]">
                            To-Do List
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                        aria-label="Close to-do list"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>

                <main className="p-4 flex-1 flex flex-col overflow-y-auto">
                    <form onSubmit={handleAddTask} className="flex items-center space-x-2 mb-4">
                        <input
                            type="text"
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            placeholder="Add a new task..."
                            className="flex-1 bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] border border-[var(--border-color)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                            aria-label="New task input"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            disabled={!newTaskText.trim()}
                        >
                            Add
                        </button>
                    </form>
                    
                    <div className="space-y-4 overflow-y-auto pr-2 -mr-2">
                        {pendingTasks.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-2">Pending ({pendingTasks.length})</h3>
                                <ul className="space-y-2">
                                    {pendingTasks.map(task => (
                                        <li key={task.id} className="flex items-center bg-[var(--bg-primary)]/50 p-2 rounded-md group animate-fade-in">
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => onToggleTask(task.id)}
                                                id={`task-${task.id}`}
                                                className="w-5 h-5 rounded text-[var(--accent-primary)] bg-[var(--bg-tertiary)] border-[var(--border-color)] focus:ring-[var(--accent-primary)] focus:ring-offset-[var(--bg-secondary)]"
                                            />
                                            <label htmlFor={`task-${task.id}`} className="ml-3 flex-1 text-sm text-[var(--text-primary)] cursor-pointer">{task.text}</label>
                                            <button onClick={() => onDeleteTask(task.id)} className="ml-3 p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--accent-danger)] opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Delete task: ${task.text}`}>
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {completedTasks.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-2">Completed ({completedTasks.length})</h3>
                                <ul className="space-y-2">
                                    {completedTasks.map(task => (
                                        <li key={task.id} className="flex items-center bg-[var(--bg-primary)]/50 p-2 rounded-md group animate-fade-in">
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={() => onToggleTask(task.id)}
                                                id={`task-${task.id}`}
                                                className="w-5 h-5 rounded text-[var(--accent-primary)] bg-[var(--bg-tertiary)] border-[var(--border-color)] focus:ring-[var(--accent-primary)] focus:ring-offset-[var(--bg-secondary)]"
                                            />
                                            <label htmlFor={`task-${task.id}`} className="ml-3 flex-1 text-sm text-[var(--text-muted)] line-through cursor-pointer">{task.text}</label>
                                            <button onClick={() => onDeleteTask(task.id)} className="ml-3 p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--accent-danger)] opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Delete task: ${task.text}`}>
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {tasks.length === 0 && (
                            <div className="text-center py-10">
                                <p className="text-[var(--text-muted)]">Your to-do list is empty.</p>
                                <p className="text-sm text-[var(--text-muted)]">Add a task above to get started!</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default TodoListModal;
