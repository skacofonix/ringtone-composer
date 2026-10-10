/**
 * Synthesized instruments, described as data: oscillators (partials), an
 * ADSR envelope and an optional FM modulator. No samples to download, so they
 * work offline and in the audio export.
 */

export const INSTRUMENT_IDS = [
  'buzzer',
  'chiptune',
  'flute',
  'organ',
  'musicBox',
  'electricPiano',
] as const;
export type InstrumentId = (typeof INSTRUMENT_IDS)[number];

export const DEFAULT_INSTRUMENT: InstrumentId = 'buzzer';

/** `pulse25` is a 25 % duty-cycle pulse, the NES/Game Boy sound. */
export type Waveform = OscillatorType | 'pulse25';

export interface Partial {
  readonly waveform: Waveform;
  /** Frequency multiple of the note (1 = fundamental). */
  readonly ratio: number;
  /** Relative level; the levels of an instrument sum to 1. */
  readonly level: number;
}

/** Times in seconds, sustain as a fraction of the peak level. */
export interface Envelope {
  readonly attack: number;
  readonly decay: number;
  readonly sustain: number;
  readonly release: number;
}

/** Frequency modulation of every partial, for bells and electric pianos. */
export interface FrequencyModulation {
  /** Modulator frequency, as a multiple of the note. */
  readonly ratio: number;
  /** Modulation depth at the attack, as a multiple of the note frequency. */
  readonly index: number;
  /** How fast the depth fades (time constant, seconds). */
  readonly decay: number;
}

export interface Instrument {
  readonly partials: readonly Partial[];
  readonly envelope: Envelope;
  readonly fm?: FrequencyModulation;
  /** Loudness compensation: a sine sounds much softer than a square. */
  readonly gain: number;
  /** Closest General MIDI program (0-based), for the .mid export. */
  readonly midiProgram: number;
}

export const INSTRUMENTS: Record<InstrumentId, Instrument> = {
  // The Nokia piezo: a plain square wave, on/off.
  buzzer: {
    partials: [{ waveform: 'square', ratio: 1, level: 1 }],
    envelope: { attack: 0.003, decay: 0, sustain: 1, release: 0.003 },
    gain: 1,
    midiProgram: 80, // Lead 1 (square)
  },
  chiptune: {
    partials: [{ waveform: 'pulse25', ratio: 1, level: 1 }],
    envelope: { attack: 0.002, decay: 0.15, sustain: 0.7, release: 0.03 },
    gain: 1.1,
    midiProgram: 80, // Lead 1 (square)
  },
  flute: {
    partials: [
      { waveform: 'sine', ratio: 1, level: 0.85 },
      { waveform: 'sine', ratio: 2, level: 0.1 },
      { waveform: 'sine', ratio: 3, level: 0.05 },
    ],
    envelope: { attack: 0.05, decay: 0.1, sustain: 0.85, release: 0.12 },
    gain: 1.7,
    midiProgram: 73, // Flute
  },
  organ: {
    partials: [
      { waveform: 'sine', ratio: 1, level: 0.45 },
      { waveform: 'sine', ratio: 2, level: 0.25 },
      { waveform: 'sine', ratio: 3, level: 0.15 },
      { waveform: 'sine', ratio: 4, level: 0.1 },
      { waveform: 'sine', ratio: 6, level: 0.05 },
    ],
    envelope: { attack: 0.01, decay: 0, sustain: 1, release: 0.06 },
    gain: 1.4,
    midiProgram: 16, // Drawbar Organ
  },
  musicBox: {
    partials: [
      { waveform: 'sine', ratio: 1, level: 0.7 },
      { waveform: 'sine', ratio: 3, level: 0.2 },
      { waveform: 'sine', ratio: 5.4, level: 0.1 },
    ],
    envelope: { attack: 0.002, decay: 0.5, sustain: 0, release: 0.6 },
    gain: 1.8,
    midiProgram: 10, // Music Box
  },
  electricPiano: {
    partials: [{ waveform: 'sine', ratio: 1, level: 1 }],
    envelope: { attack: 0.003, decay: 1, sustain: 0.25, release: 0.25 },
    fm: { ratio: 1, index: 1.5, decay: 0.3 },
    gain: 1.7,
    midiProgram: 4, // Electric Piano 1
  },
};

export function isInstrumentId(value: unknown): value is InstrumentId {
  return (INSTRUMENT_IDS as readonly unknown[]).includes(value);
}

/**
 * Fourier series of a pulse wave with the given duty cycle, for
 * `createPeriodicWave`. Index 0 is the DC offset, left at 0.
 */
export function pulseWaveCoefficients(
  duty: number,
  harmonics = 64,
): { real: Float32Array; imag: Float32Array } {
  const real = new Float32Array(harmonics + 1);
  const imag = new Float32Array(harmonics + 1);
  for (let n = 1; n <= harmonics; n++) {
    real[n] = (2 / (n * Math.PI)) * Math.sin(2 * n * Math.PI * duty);
    imag[n] = (2 / (n * Math.PI)) * (1 - Math.cos(2 * n * Math.PI * duty));
  }
  return { real, imag };
}

/** Envelope time constants are a fifth of the stage: ~99 % done at its end. */
export const TIME_CONSTANT_RATIO = 5;

/**
 * Envelope level (0–1 of the peak) after the key has been held `held`
 * seconds: attack ramp, then exponential decay towards the sustain level.
 */
export function heldLevel(envelope: Envelope, held: number): number {
  const { attack, decay, sustain } = envelope;
  if (held < attack) return held / attack;
  if (sustain >= 1 || decay <= 0) return 1;
  const timeConstant = decay / TIME_CONSTANT_RATIO;
  return sustain + (1 - sustain) * Math.exp(-(held - attack) / timeConstant);
}
