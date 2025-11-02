// aistudio.d.ts
// To augment the global 'Window' type.

interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
    clearSelectedApiKey?(): Promise<void>;
}

// FIX: All declarations of 'aistudio' must have identical modifiers.
// Use `declare global` to correctly augment the `Window` interface. This ensures
// that we're merging with the global Window type, which is necessary when the
// file is treated as a module. Without this, a local `Window` interface is created.
declare global {
    interface Window {
        aistudio: AIStudio;
    }
}

export {}; // Treat this file as a module.
