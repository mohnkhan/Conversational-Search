// aistudio.d.ts
// To augment the global 'Window' type.

// FIX: Refactored to use a named interface `AIStudio` within a global declaration block.
// This ensures that the file is treated as a module (with `export {}`) and correctly
// augments the global `Window` type, preventing duplicate identifier errors and conflicts
// with other global declarations.
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

export {};
