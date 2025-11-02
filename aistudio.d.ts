// aistudio.d.ts
// To augment the global 'Window' type within a module, it must be wrapped in a 'declare global' block.

declare global {
  // Fix: Resolved conflicting declarations for 'window.aistudio' by using an
  // inline type. This avoids potential duplicate identifier errors if another
  // declaration for 'AIStudio' exists in the project.
  interface Window {
    aistudio: {
      hasSelectedApiKey(): Promise<boolean>;
      openSelectKey(): Promise<void>;
    };
  }
}

// This ensures the file is treated as a module.
export {};
