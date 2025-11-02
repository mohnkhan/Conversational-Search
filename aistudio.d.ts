// aistudio.d.ts
// To augment the global 'Window' type.

// FIX: Refactored to use a named 'AIStudio' interface, resolving type conflicts with other global declarations of 'window.aistudio'.
declare global {
  interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
  }

  interface Window {
    aistudio: AIStudio;
  }
}

export {};
