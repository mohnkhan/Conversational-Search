// aistudio.d.ts
// To augment the global 'Window' type.

declare global {
  // FIX: Using a named global interface 'AIStudio' was causing "Duplicate identifier" errors.
  // This can happen if the TypeScript compiler processes this declaration file multiple times.
  // By inlining the type definition for `aistudio` directly on the `Window` interface,
  // we avoid creating a separate global interface that can conflict with itself.
  interface Window {
    aistudio: {
      hasSelectedApiKey(): Promise<boolean>;
      openSelectKey(): Promise<void>;
    };
  }
}

export {};
