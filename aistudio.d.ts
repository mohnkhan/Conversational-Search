// aistudio.d.ts
// To augment the global 'Window' type.

declare global {
  // FIX: To resolve "Duplicate identifier" errors, the separate `AIStudio`
  // interface was removed. The shape of the `aistudio` object is now defined
  // directly on the `Window` interface. This prevents the TypeScript compiler
  // from attempting to declare the same named interface multiple times if this
  // file is accidentally included more than once in the compilation process.
  interface Window {
    aistudio: {
      hasSelectedApiKey(): Promise<boolean>;
      openSelectKey(): Promise<void>;
    };
  }
}

export {};
