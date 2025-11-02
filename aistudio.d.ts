// aistudio.d.ts
// To augment the global 'Window' type within a module, it must be wrapped in a 'declare global' block.

// Fix for line 5: Resolved conflicting declarations by defining and using a named interface `AIStudio` as suggested by the error message.
interface AIStudio {
  hasSelectedApiKey(): Promise<boolean>;
  openSelectKey(): Promise<void>;
}

declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

// Fix: Add an export to ensure this file is treated as a module.
export {};
