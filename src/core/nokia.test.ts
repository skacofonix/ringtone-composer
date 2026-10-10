import { describe, expect, it } from 'vitest';
import {
  createEditor,
  emptyMelody,
  setCursor,
  type EditorState,
} from './editor';
import { rest, shiftDuration, toggleSharp, tone } from './melody';
import { formatNokiaNote, NOKIA_START, pressKey, type NokiaKey } from './nokia';

/** Types a sequence of keys; `(5)` is a long press, like in 2015. */
function type(sequence: string, state = createEditor()): EditorState {
  const keys = sequence.match(/\(\w+\)|\w+|[*#]/g) ?? [];
  return keys.reduce((s, token) => {
    const long = token.startsWith('(');
    const key = long ? token.slice(1, -1) : token;
    if (key.length > 1 && !['clear', 'left', 'right'].includes(key)) {
      // A run of single-character keys such as "88".
      return [...key].reduce((s2, k) => pressKey(s2, k as NokiaKey), s);
    }
    return pressKey(s, key as NokiaKey, long);
  }, state);
}

const notesOf = (state: EditorState) => state.melody.notes;

describe('pressKey: notes', () => {
  it('inserts C to B with keys 1 to 7', () => {
    const { duration, octave } = NOKIA_START;
    expect(notesOf(type('1 2 3 4 5 6 7'))).toEqual(
      (['c', 'd', 'e', 'f', 'g', 'a', 'b'] as const).map((p) =>
        tone(p, octave, duration),
      ),
    );
  });

  it('inserts a rest with 0', () => {
    expect(notesOf(type('0'))).toEqual([rest(NOKIA_START.duration)]);
  });

  it('inserts a dotted note on long press', () => {
    expect(notesOf(type('(5) (0)'))).toEqual([
      tone('g', 4, 8, true),
      rest(8, true),
    ]);
  });

  it('inherits duration and octave from the previous note', () => {
    expect(notesOf(type('1 9 * 2'))).toEqual([
      tone('c', 5, 4),
      tone('d', 5, 4),
    ]);
  });

  it('takes the octave from the last tone, skipping rests', () => {
    expect(notesOf(type('1 ** 0 3'))).toEqual([
      tone('c', 6, 8),
      rest(8),
      tone('e', 6, 8),
    ]);
  });

  it('inserts at the cursor', () => {
    const state = setCursor(type('1 3'), 1);
    expect(notesOf(pressKey(state, '2'))).toEqual([
      tone('c', 4, 8),
      tone('d', 4, 8),
      tone('e', 4, 8),
    ]);
  });
});

describe('pressKey: editing the current note', () => {
  it('makes it shorter with 8 and longer with 9', () => {
    expect(notesOf(type('1 8'))[0]!.duration).toBe(16);
    expect(notesOf(type('1 99'))[0]!.duration).toBe(2);
  });

  it('stops at 1 and 32', () => {
    expect(notesOf(type('1 99999'))[0]!.duration).toBe(1);
    expect(notesOf(type('1 88888'))[0]!.duration).toBe(32);
  });

  it('cycles the octave with *', () => {
    const octaves = ['1', '1 *', '1 **', '1 ***'].map(
      (seq) => (notesOf(type(seq))[0] as { octave: number }).octave,
    );
    expect(octaves).toEqual([4, 5, 6, 4]);
  });

  it('toggles the sharp with #', () => {
    expect(notesOf(type('1 #'))[0]).toEqual(tone('c#', 4, 8));
    expect(notesOf(type('1 ##'))[0]).toEqual(tone('c', 4, 8));
  });

  it('ignores # on e and b, and * or # on rests', () => {
    expect(notesOf(type('3 #'))[0]).toEqual(tone('e', 4, 8));
    expect(notesOf(type('0 * #'))[0]).toEqual(rest(8));
  });

  it('does nothing without a current note', () => {
    const state = createEditor();
    expect(pressKey(state, '8')).toBe(state);
    expect(pressKey(state, '*')).toBe(state);
  });
});

describe('pressKey: navigation and deletion', () => {
  it('deletes the current note with clear', () => {
    expect(notesOf(type('1 2 clear'))).toEqual([tone('c', 4, 8)]);
  });

  it('deletes everything on long clear, keeping the settings', () => {
    const state = type(
      '1 2 (clear)',
      createEditor({ ...emptyMelody(), bpm: 90 }),
    );
    expect(notesOf(state)).toEqual([]);
    expect(state.melody.bpm).toBe(90);
  });

  it('moves the cursor', () => {
    expect(type('1 2 left').cursor).toBe(1);
    expect(type('1 2 left left left right').cursor).toBe(1);
  });
});

describe('formatNokiaNote', () => {
  it('uses Nokia octaves and notation', () => {
    expect(formatNokiaNote(tone('c', 4, 4))).toBe('4c1');
    expect(formatNokiaNote(tone('f#', 5, 8, true))).toBe('8.#f2');
    expect(formatNokiaNote(rest(16))).toBe('16-');
    expect(formatNokiaNote(rest(2, true))).toBe('2.-');
  });
});

describe('note helpers', () => {
  it('keeps the same note when the duration cannot change', () => {
    const whole = tone('c', 4, 1);
    expect(shiftDuration(whole, -1)).toBe(whole);
  });

  it('toggles sharps only where they exist', () => {
    expect(toggleSharp(tone('a#', 4, 4))).toEqual(tone('a', 4, 4));
    const b = tone('b', 4, 4);
    expect(toggleSharp(b)).toBe(b);
  });
});
