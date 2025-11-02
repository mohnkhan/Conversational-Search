// aistudio.d.ts
// To augment the global 'Window' type within a module, it must be wrapped in a 'declare global' block.

declare global {
  // Fix: Use a named interface 'AIStudio' to ensure type consistency with other declarations.
  // This resolves the error about subsequent property declarations having different types.
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
