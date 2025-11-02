// aistudio.d.ts
// To augment the global 'Window' type within a module, it must be wrapped in a 'declare global' block.

declare global {
  // Fix for line 12: Resolved conflicting declarations for 'window.aistudio'.
  // By defining the AIStudio interface directly within `declare global`, we prevent
  // TypeScript from treating it as two separate types due to module resolution complexities.
  interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
  }

  interface Window {
    aistudio: AIStudio;
  }
}

// This ensures the file is treated as a module.
export {};
