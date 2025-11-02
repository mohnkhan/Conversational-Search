// aistudio.d.ts
// To augment the global 'Window' type within a module, it must be wrapped in a 'declare global' block.
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey(): Promise<boolean>;
      openSelectKey(): Promise<void>;
    };
  }
}

// Fix: Add an export to ensure this file is treated as a module.
export {};
