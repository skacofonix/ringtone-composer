/**
 * Melody model shared by every input mode (retro keypad, piano) and every
 * format (RTTTL, Nokia Composer). Pure data + pure functions, no DOM.
 */

export const PITCH_CLASSES = [
  'c',
  'c#',
  'd',
  'd#',
  'e',
  'f',
  'f#',
  'g',
  'g#',
  'a',
  'a#',
  'b',
] as const;
export type PitchClass = (typeof PITCH_CLASSES)[number];

/** Note length as a fraction of a whole note: 4 = quarter, 8 = eighth… */
export const DURATIONS = [1, 2, 4, 8, 16, 32] as const;
export type Duration = (typeof DURATIONS)[number];

/** A sounding note. `octave` follows the RTTTL numbering (4 to 7 in the spec). */
export interface Tone {
  readonly kind: 'tone';
  readonly pitch: PitchClass;
  readonly octave: number;
  readonly duration: Duration;
  readonly dotted: boolean;
}

/** A silence. */
export interface Rest {
  readonly kind: 'rest';
  readonly duration: Duration;
  readonly dotted: boolean;
}

export type Note = Tone | Rest;

export interface Melody {
  readonly name: string;
  /** Tempo in quarter notes per minute. */
  readonly bpm: number;
  readonly notes: readonly Note[];
}

/**
 * Shift between RTTTL octaves and scientific pitch notation. With 0, `a4` =
 * 440 Hz. The 2015 C# version behaved like 1 (`a4` = 880 Hz): change this
 * single constant if real ringtones sound one octave off.
 */
const RTTTL_OCTAVE_SHIFT = 0;

export function isDuration(value: number): value is Duration {
  return (DURATIONS as readonly number[]).includes(value);
}

export function tone(
  pitch: PitchClass,
  octave: number,
  duration: Duration,
  dotted = false,
): Tone {
  return { kind: 'tone', pitch, octave, duration, dotted };
}

export function rest(duration: Duration, dotted = false): Rest {
  return { kind: 'rest', duration, dotted };
}

/** MIDI note number of a tone (`a4` = 69 with the default convention). */
export function midiNumber(t: Pick<Tone, 'pitch' | 'octave'>): number {
  const semitone = PITCH_CLASSES.indexOf(t.pitch);
  return (t.octave + 1 + RTTTL_OCTAVE_SHIFT) * 12 + semitone;
}

/** Frequency in Hz, equal temperament, A440 tuning. */
export function frequency(t: Pick<Tone, 'pitch' | 'octave'>): number {
  return 440 * 2 ** ((midiNumber(t) - 69) / 12);
}

/** Length of a note in milliseconds at the given tempo. */
export function durationMs(note: Note, bpm: number): number {
  const quarterMs = 60_000 / bpm;
  const base = quarterMs * (4 / note.duration);
  return note.dotted ? base * 1.5 : base;
}

/** Total length of a melody in milliseconds. */
export function melodyDurationMs(melody: Melody): number {
  return melody.notes.reduce((sum, n) => sum + durationMs(n, melody.bpm), 0);
}

/**
 * Moves the note value along DURATIONS: positive `steps` make the note
 * shorter (4 → 8), negative ones longer (4 → 2). Clamped to 1…32.
 */
export function shiftDuration<T extends Note>(note: T, steps: number): T {
  const index = DURATIONS.indexOf(note.duration);
  const next = Math.min(DURATIONS.length - 1, Math.max(0, index + steps));
  return next === index ? note : { ...note, duration: DURATIONS[next]! };
}

/** Adds or removes the sharp. `e` and `b` have no sharp and are unchanged. */
export function toggleSharp(t: Tone): Tone {
  const pitch = t.pitch.endsWith('#') ? t.pitch.slice(0, 1) : `${t.pitch}#`;
  return PITCH_CLASSES.includes(pitch as PitchClass)
    ? { ...t, pitch: pitch as PitchClass }
    : t;
}
