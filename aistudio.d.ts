// aistudio.d.ts
// To augment the global 'Window' type.

// FIX: To correctly augment the global Window interface from what is treated as a module,
// declarations must be wrapped in `declare global`. The empty export at the end
// explicitly makes this file a module, which resolves the declaration conflict.
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
