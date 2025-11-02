// aistudio.d.ts
// To augment the global 'Window' type.

interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
    clearSelectedApiKey?(): Promise<void>;
}

// FIX: Removed `declare global` and `export {}` to resolve declaration conflicts.
// This allows the file to act as a global script and correctly augment the Window interface.
interface Window {
    aistudio: AIStudio;
}
