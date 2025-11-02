// aistudio.d.ts
// To augment the global 'Window' type within a module, it must be wrapped in a 'declare global' block.

// FIX: Define and use a named interface `AIStudio` to resolve declaration merging conflicts.
// The error message indicates that another declaration for `window.aistudio` exists and expects the type `AIStudio`.
interface AIStudio {
  hasSelectedApiKey(): Promise<boolean>;
  openSelectKey(): Promise<void>;
}

declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

// This ensures the file is treated as a module.
export {};