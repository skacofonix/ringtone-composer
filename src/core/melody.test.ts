import { describe, expect, it } from 'vitest';
import {
  canBeSharp,
  durationMs,
  frequency,
  melodyDurationMs,
  midiNumber,
  rest,
  shiftOctave,
  toggleDotted,
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

describe('note editing helpers', () => {
  it('toggles the dot', () => {
    expect(toggleDotted(tone('c', 5, 4))).toEqual(tone('c', 5, 4, true));
    expect(toggleDotted(rest(8, true))).toEqual(rest(8));
  });

  it('shifts octaves within the editable range', () => {
    expect(shiftOctave(tone('a', 5, 4), 1)).toEqual(tone('a', 6, 4));
    const top = tone('a', 7, 4);
    expect(shiftOctave(top, 1)).toBe(top);
    expect(shiftOctave(tone('a', 4, 4), -1)).toEqual(tone('a', 4, 4));
  });

  it('knows where a sharp is possible', () => {
    expect(canBeSharp(tone('c', 5, 4))).toBe(true);
    expect(canBeSharp(tone('c#', 5, 4))).toBe(true);
    expect(canBeSharp(tone('e', 5, 4))).toBe(false);
    expect(canBeSharp(rest(4))).toBe(false);
  });
});
