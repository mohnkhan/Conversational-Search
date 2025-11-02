let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
    if (typeof window !== 'undefined' && !audioCtx) {
        try {
            // Use the modern AudioContext constructor
            audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.", e);
            return null;
        }
    }
    return audioCtx;
};

/**
 * Plays a gentle "swoosh" sound, indicating a message has been sent.
 * Uses a triangle wave with a rising pitch and fading gain.
 */
export const playSendSound = (): void => {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(440, now);
    oscillator.frequency.linearRampToValueAtTime(880, now + 0.1);

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 0.15);
};

/**
 * Plays a soft "pop" sound, indicating a response has been received.
 * Uses a sine wave with a quick gain decay.
 */
export const playReceiveSound = (): void => {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
        ctx.resume();
    }
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, now);
    
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    
    oscillator.start(now);
    oscillator.stop(now + 0.1);
};
