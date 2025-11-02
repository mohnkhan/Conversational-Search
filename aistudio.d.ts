// aistudio.d.ts
// To augment the global 'Window' type within a module, it must be wrapped in a 'declare global' block.

// Fix: Replaced inline type with a named interface `AIStudio` to resolve
// conflicting declaration errors. This ensures that all declarations for
// `window.aistudio` use the same type identifier.
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
