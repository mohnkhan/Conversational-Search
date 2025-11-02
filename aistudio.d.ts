// aistudio.d.ts
// To augment the global 'Window' type.

// FIX: Wrapped type declarations in `declare global` and added `export {}` to ensure this file
// is treated as a module. This is the standard way to augment global types and resolves
// declaration merging conflicts with `window.aistudio`.
declare global {
  interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
  }

  interface Window {
    aistudio: AIStudio;
  }
}

export {};
