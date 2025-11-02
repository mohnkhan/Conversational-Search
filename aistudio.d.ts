// aistudio.d.ts
// To augment the global 'Window' type.

// FIX: Refactored to use a named 'AIStudio' interface, resolving type conflicts with other global declarations of 'window.aistudio'.
declare global {
  // FIX: Using a named 'AIStudio' interface was causing identifier and modifier conflicts.
  // By inlining the type definition for 'aistudio' directly into the 'Window' interface augmentation,
  // we avoid a potential name collision with another global 'AIStudio' type and resolve the declaration errors.
  interface Window {
    aistudio: {
      hasSelectedApiKey(): Promise<boolean>;
      openSelectKey(): Promise<void>;
    };
  }
}

export {};