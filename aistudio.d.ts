// aistudio.d.ts
// To augment the global 'Window' type.

declare global {
  // FIX: The `AIStudio` interface is defined here and used for `window.aistudio`
  // to resolve errors about mismatching types and modifiers across declarations.
  // Defining it within the global scope prevents potential module-level naming conflicts.
  interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
  }

  interface Window {
    aistudio: AIStudio;
  }
}

export {};
