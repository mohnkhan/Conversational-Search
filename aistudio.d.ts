// aistudio.d.ts
// To augment the global 'Window' type.

declare global {
  // FIX: To resolve type conflicts, this file now defines and uses a global
  // `AIStudio` interface. By placing `AIStudio` inside `declare global`, it
  // can be merged with other declarations, avoiding "duplicate identifier" errors
  // while ensuring `window.aistudio` has a consistent type.
  interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
  }

  interface Window {
    aistudio: AIStudio;
  }
}

export {};
