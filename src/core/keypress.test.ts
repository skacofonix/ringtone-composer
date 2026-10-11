import { describe, expect, it } from 'vitest';
import { rest, tone } from './melody';
import { KeySequenceError, parseKeySequence, toKeySequence } from './keypress';
import { parseRtttl } from './rtttl';

describe('parseKeySequence', () => {
  it('reads the example of docs/nokia-composer.md', () => {
    // 5: g, 9: longer (quarter); (6): dotted a, 8: eighth, #: a#, **: octave 3.
    expect(parseKeySequence('5 9 (6) 8 #**')).toEqual([
      tone('g', 4, 4),
      tone('a#', 6, 8, true),
    ]);
  });

  it('starts from duration 8 and Nokia octave 1', () => {
    expect(parseKeySequence('1')).toEqual([tone('c', 4, 8)]);
  });

  it('reads rests and dotted rests', () => {
    expect(parseKeySequence('0 (0)')).toEqual([rest(8), rest(8, true)]);
  });

  it('ignores spaces and line breaks', () => {
    expect(parseKeySequence(' 1\n2\t3 ')).toHaveLength(3);
  });

  it('accepts an empty sequence', () => {
    expect(parseKeySequence('')).toEqual([]);
  });

  describe('errors', () => {
    const errorOf = (text: string) => {
      try {
        parseKeySequence(text);
      } catch (e) {
        if (e instanceof KeySequenceError) return e;
        throw e;
      }
      throw new Error(`no error for ${text}`);
    };

    it('reports an invalid key with its position', () => {
      const error = errorOf('1 2 x');
      expect(error.code).toBe('invalidKey');
      expect(error.position).toBe(4);
    });

    it('rejects a long press on a key that does not insert a note', () => {
      expect(errorOf('1 (8)').code).toBe('invalidLongPress');
      expect(errorOf('1 (5').code).toBe('invalidLongPress');
    });
  });
});

describe('toKeySequence', () => {
  it('writes the keys for each note', () => {
    const { text, approximated } = toKeySequence([
      tone('g', 4, 4),
      tone('a#', 6, 8, true),
      rest(16),
    ]);
    expect(text).toBe('59 (6)8#** 08');
    expect(approximated).toBe(false);
  });

  it('cycles the octave forward with *', () => {
    // From octave 3 (RTTTL 6) back to 1 (RTTTL 4): one press wraps around.
    const { text } = toKeySequence([tone('c', 6, 8), tone('d', 4, 8)]);
    expect(text).toBe('1** 2*');
  });

  it('round-trips the Nokia tune', () => {
    const notes = parseRtttl(
      'Nokia Tune:d=4,o=5,b=225:8e6,8d6,f#,g#,8c#6,8b,d,e,8b,8a,c#,e,2a',
    ).notes;
    const { text, approximated } = toKeySequence(notes);
    expect(approximated).toBe(false);
    expect(parseKeySequence(text)).toEqual(notes);
  });

  it('brings octaves out of range back, and says so', () => {
    const { text, approximated } = toKeySequence([tone('c', 7, 8)]);
    expect(approximated).toBe(true);
    expect(parseKeySequence(text)).toEqual([tone('c', 6, 8)]);
  });
});
