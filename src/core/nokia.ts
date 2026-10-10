/**
 * The "Composer" of the Nokia 3310: its on-screen notation and its keypad.
 * Reference: docs/nokia-composer.md
 */
import {
  deleteBackward,
  clearNotes,
  insertNote,
  moveCursor,
  noteBeforeCursor,
  updateNoteBeforeCursor,
  type EditorState,
} from './editor';
import {
  rest,
  shiftDuration,
  tone,
  toggleSharp,
  type Duration,
  type Note,
  type PitchClass,
} from './melody';

/** Nokia octaves 1–3 are RTTTL octaves 4–6. */
const OCTAVE_OFFSET = 3;
const MIN_OCTAVE = 4;
const MAX_OCTAVE = 6;

/** State of the composer before the first note (from the 2015 version). */
export const NOKIA_START = { duration: 8 as Duration, octave: MIN_OCTAVE };

export type NokiaKey =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '*'
  | '#'
  | 'clear'
  | 'left'
  | 'right';

const NOTE_KEYS: Partial<Record<NokiaKey, PitchClass>> = {
  '1': 'c',
  '2': 'd',
  '3': 'e',
  '4': 'f',
  '5': 'g',
  '6': 'a',
  '7': 'b',
};

export function toNokiaOctave(rtttlOctave: number): number {
  return rtttlOctave - OCTAVE_OFFSET;
}

/**
 * Applies a key press, like the Composer did:
 * - `1`–`7` insert C–B, `0` a rest, with the duration and octave of the
 *   previous note; a long press inserts a dotted note;
 * - `8` / `9` make the current note shorter / longer;
 * - `*` cycles the octave of the current note (1 → 2 → 3 → 1);
 * - `#` toggles its sharp;
 * - `clear` deletes the current note, a long press deletes everything;
 * - `left` / `right` move the cursor.
 *
 * The current note is the one before the cursor.
 */
export function pressKey(
  state: EditorState,
  key: NokiaKey,
  long = false,
): EditorState {
  const pitch = NOTE_KEYS[key];
  if (pitch) {
    const { duration, octave } = inheritedSettings(state);
    return insertNote(state, tone(pitch, octave, duration, long));
  }

  switch (key) {
    case '0':
      return insertNote(state, rest(inheritedSettings(state).duration, long));
    case '8':
      return updateNoteBeforeCursor(state, (n) => shiftDuration(n, 1));
    case '9':
      return updateNoteBeforeCursor(state, (n) => shiftDuration(n, -1));
    case '*':
      return updateNoteBeforeCursor(state, (n) =>
        n.kind === 'tone' ? { ...n, octave: nextOctave(n.octave) } : n,
      );
    case '#':
      return updateNoteBeforeCursor(state, (n) =>
        n.kind === 'tone' ? toggleSharp(n) : n,
      );
    case 'clear':
      return long ? clearNotes(state) : deleteBackward(state);
    case 'left':
      return moveCursor(state, -1);
    case 'right':
      return moveCursor(state, 1);
    default:
      return state;
  }
}

/** Duration of the previous note and octave of the previous tone. */
function inheritedSettings(state: EditorState): {
  duration: Duration;
  octave: number;
} {
  const previous = noteBeforeCursor(state);
  const notes = state.melody.notes.slice(0, state.cursor);
  const previousTone = notes.findLast((n) => n.kind === 'tone');
  return {
    duration: previous?.duration ?? NOKIA_START.duration,
    octave: previousTone?.octave ?? NOKIA_START.octave,
  };
}

function nextOctave(octave: number): number {
  return octave >= MAX_OCTAVE || octave < MIN_OCTAVE ? MIN_OCTAVE : octave + 1;
}

/**
 * A note in Composer notation: duration, dot, sharp, note, octave.
 * Examples: `4c1`, `8.#f2`, `16-`.
 */
export function formatNokiaNote(note: Note): string {
  const dot = note.dotted ? '.' : '';
  if (note.kind === 'rest') return `${note.duration}${dot}-`;
  const sharp = note.pitch.endsWith('#') ? '#' : '';
  return `${note.duration}${dot}${sharp}${note.pitch[0]}${toNokiaOctave(note.octave)}`;
}
