// aistudio.d.ts
// To augment the global 'Window' type.

declare global {
  // FIX: To resolve "Duplicate identifier" errors, the separate `AIStudio` interface
  // has been removed. The type for `window.aistudio` is now defined inline to prevent
  // naming conflicts with other potential global declarations of `AIStudio`.
  interface Window {
    aistudio: {
      hasSelectedApiKey(): Promise<boolean>;
      openSelectKey(): Promise<void>;
    };
  }
}

export {};
