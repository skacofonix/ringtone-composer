import { describe, expect, it } from 'vitest';
import { rest, tone, type Melody } from './melody';
import { parseRtttl, RtttlParseError, serializeRtttl } from './rtttl';

const NOKIA_TUNE =
  'NokiaTune:d=4,o=5,b=225:8e6,8d6,f#,g#,8c#6,8b,d,e,8b,8a,c#,e,2a';

describe('parseRtttl', () => {
  it('parses the Nokia tune', () => {
    const melody = parseRtttl(NOKIA_TUNE);

    expect(melody.name).toBe('NokiaTune');
    expect(melody.bpm).toBe(225);
    expect(melody.notes).toHaveLength(13);
    expect(melody.notes[0]).toEqual(tone('e', 6, 8));
    expect(melody.notes[2]).toEqual(tone('f#', 5, 4));
    expect(melody.notes[12]).toEqual(tone('a', 5, 2));
  });

  it('parses rests', () => {
    expect(parseRtttl('x:d=4,o=5,b=100:p,8p').notes).toEqual([
      rest(4),
      rest(8),
    ]);
  });

  it('uses the spec defaults when they are missing', () => {
    const melody = parseRtttl('x::c');
    expect(melody.bpm).toBe(63);
    expect(melody.notes).toEqual([tone('c', 6, 4)]);
  });

  it('accepts partial defaults in any order', () => {
    const melody = parseRtttl('x:b=90,o=4:c');
    expect(melody.bpm).toBe(90);
    expect(melody.notes).toEqual([tone('c', 4, 4)]);
  });

  it('accepts a melody without defaults section', () => {
    // Supported by the 2015 C# version.
    expect(parseRtttl('x:8c,d').notes).toEqual([
      tone('c', 6, 8),
      tone('d', 6, 4),
    ]);
  });

  it('accepts the dot before or after the octave', () => {
    const expected = tone('c#', 5, 8, true);
    expect(parseRtttl('x:d=4,o=6,b=63:8c#.5').notes[0]).toEqual(expected);
    expect(parseRtttl('x:d=4,o=6,b=63:8c#5.').notes[0]).toEqual(expected);
  });

  it('accepts the sharp before or after the note', () => {
    expect(parseRtttl('x::#f').notes[0]).toEqual(tone('f#', 6, 4));
  });

  it('is case and whitespace insensitive', () => {
    const melody = parseRtttl(' Song : D=8, O=5, B=120 :\n C, 4E6 ,\tP ');
    expect(melody.name).toBe('Song');
    expect(melody.notes).toEqual([tone('c', 5, 8), tone('e', 6, 4), rest(8)]);
  });

  it('reads h as b (German notation)', () => {
    expect(parseRtttl('x::h').notes[0]).toEqual(tone('b', 6, 4));
  });

  it('ignores a trailing comma and unknown default keys', () => {
    const melody = parseRtttl('x:d=4,l=15:c,d,');
    expect(melody.notes).toHaveLength(2);
  });

  it('accepts an empty melody', () => {
    expect(parseRtttl('x:d=4,o=5,b=100:').notes).toEqual([]);
  });

  describe('errors', () => {
    const errorOf = (text: string): RtttlParseError => {
      try {
        parseRtttl(text);
      } catch (e) {
        if (e instanceof RtttlParseError) return e;
        throw e;
      }
      throw new Error(`no error for ${text}`);
    };

    it('rejects text without sections', () => {
      expect(errorOf('just text').position).toBe(9);
    });

    it('rejects too many sections', () => {
      expect(errorOf('a:b:c:d').position).toBe(5);
    });

    it('reports the position of an invalid note', () => {
      expect(errorOf('x:d=4:c, zz').position).toBe(9);
    });

    it('rejects invalid durations', () => {
      expect(errorOf('x::3c').position).toBe(3);
      expect(errorOf('x:d=3:c').position).toBe(2);
    });

    it('rejects out of range octaves', () => {
      expect(() => parseRtttl('x::c9')).toThrow(RtttlParseError);
      expect(() => parseRtttl('x:o=2:c')).toThrow(RtttlParseError);
    });

    it('rejects sharps that do not exist', () => {
      expect(() => parseRtttl('x::e#')).toThrow(RtttlParseError);
      expect(() => parseRtttl('x::p#')).toThrow(RtttlParseError);
      expect(() => parseRtttl('x::#c#')).toThrow(RtttlParseError);
    });

    it('rejects a null tempo', () => {
      expect(() => parseRtttl('x:b=0:c')).toThrow(RtttlParseError);
    });
  });
});

describe('serializeRtttl', () => {
  it('uses the most frequent duration and octave as defaults', () => {
    const melody: Melody = {
      name: 'Test',
      bpm: 120,
      notes: [tone('c', 5, 8), tone('d', 5, 8), tone('e', 6, 4), rest(8)],
    };
    expect(serializeRtttl(melody)).toBe('Test:d=8,o=5,b=120:c,d,4e6,p');
  });

  it('writes sharps and dots in the spec order', () => {
    const melody: Melody = {
      name: 'x',
      bpm: 100,
      notes: [tone('f#', 5, 4, true), tone('g#', 6, 8, true), rest(4, true)],
    };
    expect(serializeRtttl(melody)).toBe('x:d=4,o=5,b=100:f#.,8g#6.,p.');
  });

  it('removes separators from the name', () => {
    const melody: Melody = { name: 'a:b,c', bpm: 63, notes: [] };
    expect(serializeRtttl(melody)).toBe('abc:d=4,o=6,b=63:');
  });

  it('round-trips the Nokia tune', () => {
    const melody = parseRtttl(NOKIA_TUNE);
    expect(parseRtttl(serializeRtttl(melody))).toEqual(melody);
  });
});
