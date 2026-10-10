/**
 * Editing operations on a melody, shared by every input mode. The cursor is
 * an insertion point between notes, like a text caret: 0 is before the first
 * note, `notes.length` after the last one.
 */
import type { Melody, Note } from './melody';

export interface EditorState {
  readonly melody: Melody;
  readonly cursor: number;
}

/** Tempo range of the original RTTTL specification. */
export const MIN_BPM = 25;
export const MAX_BPM = 900;

export function emptyMelody(): Melody {
  return { name: 'Ma sonnerie', bpm: 120, notes: [] };
}

/** Opens a melody with the cursor after the last note. */
export function createEditor(melody: Melody = emptyMelody()): EditorState {
  return { melody, cursor: melody.notes.length };
}

/** Inserts a note at the cursor and moves the cursor after it. */
export function insertNote(state: EditorState, note: Note): EditorState {
  const notes = state.melody.notes.toSpliced(state.cursor, 0, note);
  return { melody: { ...state.melody, notes }, cursor: state.cursor + 1 };
}

/** Deletes the note before the cursor (like Backspace). */
export function deleteBackward(state: EditorState): EditorState {
  if (state.cursor === 0) return state;
  const notes = state.melody.notes.toSpliced(state.cursor - 1, 1);
  return { melody: { ...state.melody, notes }, cursor: state.cursor - 1 };
}

/** Moves the cursor to `index`, clamped to the melody bounds. */
export function setCursor(state: EditorState, index: number): EditorState {
  const cursor = clamp(Math.round(index), 0, state.melody.notes.length);
  return cursor === state.cursor ? state : { ...state, cursor };
}

export function moveCursor(state: EditorState, delta: number): EditorState {
  return setCursor(state, state.cursor + delta);
}

/** Sets the tempo, clamped to the RTTTL range. */
export function setBpm(state: EditorState, bpm: number): EditorState {
  const value = clamp(Math.round(bpm), MIN_BPM, MAX_BPM);
  return { ...state, melody: { ...state.melody, bpm: value } };
}

export function setName(state: EditorState, name: string): EditorState {
  return { ...state, melody: { ...state.melody, name } };
}

/** Removes every note, keeping the name and the tempo. */
export function clearNotes(state: EditorState): EditorState {
  return { melody: { ...state.melody, notes: [] }, cursor: 0 };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
