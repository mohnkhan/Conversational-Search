// aistudio.d.ts
// To augment the global 'Window' type.

declare global {
  // FIX: Declaring the AIStudio interface within the `declare global` block
  // ensures it's available for augmenting the Window interface while preventing
  // "Duplicate identifier" errors that can occur if this file is processed multiple times.
  // This resolves the error about 'aistudio' needing to be of type 'AIStudio'.
  interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
  }
  interface Window {
    aistudio: AIStudio;
  }
}

export {};
