// aistudio.d.ts

// This file augments the global Window object with non-standard properties.
// By adding `export {}`, we make it a module, which is the correct way to
// declare global augmentations.

export {};

// FIX: Added full definitions for the Web Speech API to resolve "Cannot find name" errors.
// These types are sometimes not included in default TypeScript configurations.
interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
}

interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly [index: number]: SpeechRecognitionAlternative;
    length: number;
}

interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}

interface SpeechRecognition extends EventTarget {
    grammars: any; // SpeechGrammarList
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    serviceURI: string;
    start(): void;
    stop(): void;
    abort(): void;
    onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
    onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
}


declare global {
  /**
   * Interface for the AI Studio helper object injected into the window.
   */
  interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
    clearSelectedApiKey?(): Promise<void>;
  }

  /**
   * Augment the global Window interface.
   */
  interface Window {
    aistudio?: AIStudio;

    // The SpeechRecognition constructor might not be on the default Window type,
    // even if the SpeechRecognition interface itself is available. We add it here.
    // The `SpeechRecognition` type itself is assumed to be provided by TS's "dom" lib.
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }

  // The detailed interfaces for the Web Speech API (like SpeechRecognition,
  // SpeechRecognitionEvent, etc.) are now removed from this file. They are expected
  // to be provided by TypeScript's built-in DOM library (`lib: ["dom"]`).
  // This avoids "Duplicate identifier" errors if they are already defined globally.
}
