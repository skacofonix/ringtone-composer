/**
 * Key sequences, as printed in magazines to type a ringtone on the Nokia
 * Composer: `5 9 (6) 8 #**`. Parentheses mean a long press (dotted note).
 * Reading replays the keys on the T9 state machine of nokia.ts, so it behaves
 * exactly like the retro keypad. Reference: docs/nokia-composer.md
 */
import { createEditor, emptyMelody } from './editor';
import { DURATIONS, type Note } from './melody';
import { NOKIA_START, pressKey, type NokiaKey } from './nokia';

export type KeySequenceErrorCode = 'invalidKey' | 'invalidLongPress';

export class KeySequenceError extends Error {
  readonly code: KeySequenceErrorCode;
  /** The faulty fragment of text. */
  readonly detail: string;
  /** Character offset in the parsed text. */
  readonly position: number;

  constructor(code: KeySequenceErrorCode, detail: string, position: number) {
    super(`Key sequence ${code} error "${detail}" at position ${position}`);
    this.name = 'KeySequenceError';
    this.code = code;
    this.detail = detail;
    this.position = position;
  }
}

const KEYS = new Set<string>([
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '*',
  '#',
]);
/** Keys that insert a note, the only ones a long press changes. */
const LONG_PRESS_KEYS = new Set<string>([
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
]);

const NOTE_KEYS: Record<string, string> = {
  c: '1',
  d: '2',
  e: '3',
  f: '4',
  g: '5',
  a: '6',
  b: '7',
};

/** Octaves the Composer can type: Nokia 1 to 3 (RTTTL 4 to 6). */
const MIN_OCTAVE = NOKIA_START.octave;
const MAX_OCTAVE = NOKIA_START.octave + 2;

/**
 * Types a key sequence on an empty Composer and returns the notes.
 * Spaces and line breaks are ignored.
 *
 * @throws {KeySequenceError} with the position of the faulty character.
 */
export function parseKeySequence(text: string): Note[] {
  let state = createEditor(emptyMelody());
  let i = 0;
  while (i < text.length) {
    const char = text[i]!;
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    if (char === '(') {
      const match = /^\((.)\)/.exec(text.slice(i));
      if (!match || !LONG_PRESS_KEYS.has(match[1]!)) {
        throw new KeySequenceError('invalidLongPress', text.slice(i, i + 3), i);
      }
      state = pressKey(state, match[1] as NokiaKey, true);
      i += 3;
      continue;
    }
    if (!KEYS.has(char)) {
      throw new KeySequenceError('invalidKey', char, i);
    }
    state = pressKey(state, char as NokiaKey);
    i++;
  }
  return [...state.melody.notes];
}

export interface KeySequence {
  readonly text: string;
  /**
   * True when some notes could not be typed exactly: octaves out of the
   * Composer range are brought back to the nearest one.
   */
  readonly approximated: boolean;
}

/** The keys to type `notes` on a Nokia Composer, one group per note. */
export function toKeySequence(notes: readonly Note[]): KeySequence {
  let duration: (typeof DURATIONS)[number] = NOKIA_START.duration;
  let octave = NOKIA_START.octave;
  let approximated = false;

  const groups = notes.map((note) => {
    const key = note.kind === 'tone' ? NOTE_KEYS[note.pitch[0]!]! : '0';
    let group = note.dotted ? `(${key})` : key;

    // 8 makes the new note shorter, 9 longer, one note value per press.
    const steps =
      DURATIONS.indexOf(note.duration) - DURATIONS.indexOf(duration);
    group += (steps > 0 ? '8' : '9').repeat(Math.abs(steps));
    duration = note.duration;

    if (note.kind === 'tone') {
      if (note.pitch.endsWith('#')) group += '#';
      const target = Math.min(MAX_OCTAVE, Math.max(MIN_OCTAVE, note.octave));
      if (target !== note.octave) approximated = true;
      // * cycles the octave: 1 → 2 → 3 → 1.
      const presses = (target - octave + 3) % 3;
      group += '*'.repeat(presses);
      octave = target;
    }
    return group;
  });

  return { text: groups.join(' '), approximated };
}
