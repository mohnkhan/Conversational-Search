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

// FIX: Removed the `declare global` block, which caused an "Augmentations for the global scope" error.
// In a global script file (one without top-level imports/exports), global interfaces like `Window`
// can be augmented directly without this wrapper.
interface Window {
  // FIX: Removed 'readonly' modifier to resolve the "All declarations of 'aistudio' must have identical modifiers" error. This ensures this declaration matches another one elsewhere in the project.
  aistudio: AIStudio;
}
