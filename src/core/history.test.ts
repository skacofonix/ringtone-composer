import { describe, expect, it } from 'vitest';
import {
  canRedo,
  canUndo,
  createHistory,
  HISTORY_LIMIT,
  record,
  redo,
  undo,
} from './history';

describe('history', () => {
  it('starts with nothing to undo or redo', () => {
    const h = createHistory('a');
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
  });

  it('undoes and redoes', () => {
    let h = record(record(createHistory('a'), 'b'), 'c');
    h = undo(h);
    expect(h.present).toBe('b');
    h = undo(h);
    expect(h.present).toBe('a');
    expect(canUndo(h)).toBe(false);
    h = redo(redo(h));
    expect(h.present).toBe('c');
    expect(canRedo(h)).toBe(false);
  });

  it('clears the redo steps on a new change', () => {
    const h = record(undo(record(createHistory('a'), 'b')), 'c');
    expect(canRedo(h)).toBe(false);
    expect(undo(h).present).toBe('a');
  });

  it('ignores a change to the same state', () => {
    const h = createHistory('a');
    expect(record(h, 'a')).toBe(h);
  });

  it('merges consecutive changes of the same group', () => {
    let h = createHistory('');
    for (const text of ['N', 'No', 'Nok', 'Noki', 'Nokia']) {
      h = record(h, text, 'name');
    }
    expect(h.present).toBe('Nokia');
    expect(undo(h).present).toBe('');
  });

  it('starts a new step after another kind of change or an undo', () => {
    let h = record(createHistory('a'), 'b', 'name');
    h = record(h, 'c');
    h = record(h, 'd', 'name');
    expect(undo(h).present).toBe('c');
    const afterUndo = record(undo(h), 'e', 'name');
    expect(afterUndo.past).toEqual(['a', 'b', 'c']);
  });

  it('keeps a limited number of steps', () => {
    let h = createHistory(0);
    for (let i = 1; i <= HISTORY_LIMIT + 10; i++) h = record(h, i);
    expect(h.past).toHaveLength(HISTORY_LIMIT);
    expect(h.past[0]).toBe(10);
  });

  it('does nothing when there is nothing to undo or redo', () => {
    const h = createHistory('a');
    expect(undo(h)).toBe(h);
    expect(redo(h)).toBe(h);
  });
});
