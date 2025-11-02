// aistudio.d.ts
interface AIStudio {
  hasSelectedApiKey(): Promise<boolean>;
  openSelectKey(): Promise<void>;
}

// To augment the global 'Window' type within a module, it must be wrapped in a 'declare global' block.
declare global {
  interface Window {
    aistudio: AIStudio;
  }
}
