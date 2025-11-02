// aistudio.d.ts
// To augment the global 'Window' type.

// FIX: The module-style global augmentation was causing "Duplicate identifier" errors.
// This is likely due to a project configuration issue where this file is not treated as a module.
// Reverting to a simple ambient (global) declaration file resolves the conflicts.
interface AIStudio {
  hasSelectedApiKey(): Promise<boolean>;
  openSelectKey(): Promise<void>;
  clearSelectedApiKey?(): Promise<void>;
}

interface Window {
  aistudio: AIStudio;
}
