// aistudio.d.ts
// To augment the global 'Window' type.

declare global {
  // FIX: An inline type definition for `aistudio` was causing conflicts with other global declarations.
  // Defining a global `AIStudio` interface and using it for `window.aistudio` ensures type consistency
  // across all declarations and resolves the errors.
  interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
  }

  interface Window {
    aistudio: AIStudio;
  }
}

export {};
