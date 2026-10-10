import { describe, expect, it } from 'vitest';
import {
  clearNotes,
  createEditor,
  deleteBackward,
  emptyMelody,
  insertNote,
  MAX_BPM,
  MIN_BPM,
  moveCursor,
  setBpm,
  setCursor,
  setName,
} from './editor';
import { rest, tone } from './melody';

const c = tone('c', 5, 4);
const d = tone('d', 5, 4);
const e = tone('e', 5, 4);

const withNotes = (...notes: ReturnType<typeof tone>[]) =>
  createEditor({ ...emptyMelody(), notes });

describe('createEditor', () => {
  it('starts with an empty melody and the cursor at 0', () => {
    const state = createEditor();
    expect(state.melody.notes).toEqual([]);
    expect(state.cursor).toBe(0);
  });

  it('places the cursor after the last note', () => {
    expect(withNotes(c, d).cursor).toBe(2);
  });
});

describe('insertNote', () => {
  it('appends at the end', () => {
    const state = insertNote(insertNote(createEditor(), c), rest(8));
    expect(state.melody.notes).toEqual([c, rest(8)]);
    expect(state.cursor).toBe(2);
  });

  it('inserts at the cursor', () => {
    const state = insertNote(setCursor(withNotes(c, e), 1), d);
    expect(state.melody.notes).toEqual([c, d, e]);
    expect(state.cursor).toBe(2);
  });

  it('does not mutate the previous state', () => {
    const before = withNotes(c);
    insertNote(before, d);
    expect(before.melody.notes).toEqual([c]);
  });
});

describe('deleteBackward', () => {
  it('removes the note before the cursor', () => {
    const state = deleteBackward(setCursor(withNotes(c, d, e), 2));
    expect(state.melody.notes).toEqual([c, e]);
    expect(state.cursor).toBe(1);
  });

  it('does nothing at the start', () => {
    const state = setCursor(withNotes(c), 0);
    expect(deleteBackward(state)).toBe(state);
  });
});

describe('cursor', () => {
  it('is clamped to the melody', () => {
    const state = withNotes(c, d);
    expect(setCursor(state, -3).cursor).toBe(0);
    expect(setCursor(state, 10).cursor).toBe(2);
    expect(moveCursor(state, -1).cursor).toBe(1);
  });
});

describe('melody settings', () => {
  it('clamps the tempo to the RTTTL range', () => {
    const state = createEditor();
    expect(setBpm(state, 10).melody.bpm).toBe(MIN_BPM);
    expect(setBpm(state, 5000).melody.bpm).toBe(MAX_BPM);
    expect(setBpm(state, 140.4).melody.bpm).toBe(140);
  });

  it('renames', () => {
    expect(setName(createEditor(), 'Tetris').melody.name).toBe('Tetris');
  });

  it('clears notes but keeps name and tempo', () => {
    const state = clearNotes(setBpm(withNotes(c, d), 200));
    expect(state.melody.notes).toEqual([]);
    expect(state.melody.bpm).toBe(200);
    expect(state.cursor).toBe(0);
  });
});
