import { describe, expect, it } from 'vitest';
import {
  durationMs,
  frequency,
  melodyDurationMs,
  midiNumber,
  rest,
  tone,
} from './melody';

describe('pitch', () => {
  it('tunes a4 to 440 Hz', () => {
    expect(midiNumber(tone('a', 4, 4))).toBe(69);
    expect(frequency(tone('a', 4, 4))).toBeCloseTo(440);
  });

  it('places c4 at middle C', () => {
    expect(midiNumber(tone('c', 4, 4))).toBe(60);
    expect(frequency(tone('c', 4, 4))).toBeCloseTo(261.63, 2);
  });

  it('doubles the frequency every octave', () => {
    expect(frequency(tone('a', 5, 4))).toBeCloseTo(880);
    expect(frequency(tone('c#', 6, 4))).toBeCloseTo(1108.73, 2);
  });
});

describe('duration', () => {
  it('gives a quarter note one beat', () => {
    expect(durationMs(tone('c', 5, 4), 120)).toBe(500);
  });

  it('scales with the note value', () => {
    expect(durationMs(tone('c', 5, 1), 120)).toBe(2000);
    expect(durationMs(rest(16), 120)).toBe(125);
  });

  it('adds half the value for dotted notes', () => {
    expect(durationMs(tone('c', 5, 4, true), 120)).toBe(750);
  });

  it('sums a melody', () => {
    const melody = { name: 't', bpm: 60, notes: [tone('c', 5, 4), rest(2)] };
    expect(melodyDurationMs(melody)).toBe(3000);
  });
});
