// aistudio.d.ts
// To augment the global 'Window' type.

// FIX: Converted file to a global script to resolve declaration conflicts by removing `declare global` and `export {}`.
interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
    clearSelectedApiKey?(): Promise<void>;
}
interface Window {
    aistudio: AIStudio;
}
