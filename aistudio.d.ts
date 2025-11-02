// aistudio.d.ts
// To augment the global 'Window' type.

// FIX: Converted this file to a global script file by removing `export {}` and the `declare global` block.
// This simplifies global type augmentation and resolves declaration merging conflicts with `window.aistudio`.
interface AIStudio {
  hasSelectedApiKey(): Promise<boolean>;
  openSelectKey(): Promise<void>;
}

interface Window {
  aistudio: AIStudio;
}
