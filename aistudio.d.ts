// aistudio.d.ts
// To augment the global 'Window' type.

// FIX: To correctly augment the global Window interface from what is treated as a module,
// declarations must be wrapped in `declare global`. The empty export at the end
// explicitly makes this file a module, which resolves the declaration conflict.
// FIX: Inlined the AIStudio interface to avoid conflicts with other global type definitions that could be causing "duplicate identifier" errors.
declare global {
  interface Window {
      aistudio: {
        hasSelectedApiKey(): Promise<boolean>;
        openSelectKey(): Promise<void>;
        clearSelectedApiKey?(): Promise<void>;
      };
  }
}

export {};
