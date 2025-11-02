// aistudio.d.ts
// To augment the global 'Window' type.

// FIX: The property 'aistudio' on 'Window' was declared with an inline type,
// which conflicted with another declaration expecting the type 'AIStudio'.
// This has been fixed by defining a global 'AIStudio' interface and using it
// as the type for 'window.aistudio' to ensure consistency.
declare global {
  // FIX: The declarations for `AIStudio` and `window.aistudio` were removed to prevent
  // conflicts with existing global types, which were causing "Duplicate identifier"
  // and modifier mismatch errors. It is assumed these types are provided by the
  // execution environment or another type definition file.
}

export {};
