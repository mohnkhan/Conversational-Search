// aistudio.d.ts
// To augment the global 'Window' type within a module, it must be wrapped in a 'declare global' block.

declare global {
  // Fix: Resolved conflicting declarations for 'window.aistudio' by using a named
  // interface 'AIStudio'. This avoids issues where other parts of the codebase
  // expect a specific named type rather than a structurally-equivalent anonymous type.
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
