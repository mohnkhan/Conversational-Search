// aistudio.d.ts
// To augment the global 'Window' type.

// FIX: Moved the AIStudio interface inside the `declare global` block.
// By defining the interface within the global scope, we ensure that we are augmenting
// the global `Window` type without creating module-scoped type conflicts. This resolves
// errors about 'identical modifiers' and also makes the `clearSelectedApiKey` property
// correctly available on `window.aistudio` throughout the application.
declare global {
    interface AIStudio {
        hasSelectedApiKey(): Promise<boolean>;
        openSelectKey(): Promise<void>;
        clearSelectedApiKey?(): Promise<void>;
    }

    interface Window {
        aistudio: AIStudio;
    }
}

export {}; // Treat this file as a module.
