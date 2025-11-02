// aistudio.d.ts
// To augment the global 'Window' type within a module, it must be wrapped in a 'declare global' block.

// Fix: Using an inline type for `window.aistudio` to avoid potential naming
// conflicts with other `AIStudio` interface declarations across the project.
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey(): Promise<boolean>;
      openSelectKey(): Promise<void>;
    };
  }
}

// This ensures the file is treated as a module.
export {};
