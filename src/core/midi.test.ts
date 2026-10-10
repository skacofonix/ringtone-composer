import { describe, expect, it } from 'vitest';
import { rest, tone, type Melody } from './melody';
import { encodeMidi, encodeVlq, noteTicks, TICKS_PER_QUARTER } from './midi';

const hex = (bytes: ArrayLike<number>) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(' ');

describe('encodeVlq', () => {
  it.each([
    [0, '00'],
    [0x7f, '7f'],
    [0x80, '81 00'],
    [0x3fff, 'ff 7f'],
    [0x4000, '81 80 00'],
    [0x200000, '81 80 80 00'],
  ])('encodes %i', (value, expected) => {
    expect(hex(encodeVlq(value))).toBe(expected);
  });
});

describe('noteTicks', () => {
  it('counts ticks from the note value', () => {
    expect(noteTicks(tone('c', 4, 4))).toBe(TICKS_PER_QUARTER);
    expect(noteTicks(tone('c', 4, 1))).toBe(TICKS_PER_QUARTER * 4);
    expect(noteTicks(rest(8, true))).toBe(360);
    expect(noteTicks(tone('c', 4, 32))).toBe(60);
  });
});

describe('encodeMidi', () => {
  const melody: Melody = {
    name: 'Hi',
    bpm: 120,
    notes: [tone('a', 4, 4), rest(4), tone('c', 5, 8)],
  };
  const bytes = encodeMidi(melody, 73);
  const text = hex(bytes);

  it('writes a format 0 header with one track', () => {
    expect(hex(bytes.slice(0, 14))).toBe(
      '4d 54 68 64 00 00 00 06 00 00 00 01 01 e0',
    );
    expect(hex(bytes.slice(14, 18))).toBe('4d 54 72 6b');
  });

  it('declares the track length', () => {
    const length = new DataView(bytes.buffer).getUint32(18);
    expect(length).toBe(bytes.length - 22);
  });

  it('writes name, tempo (500000 µs at 120 BPM) and program', () => {
    expect(text).toContain('00 ff 03 02 48 69');
    expect(text).toContain('00 ff 51 03 07 a1 20');
    expect(text).toContain('00 c0 49');
  });

  it('writes notes, rests as delays, and the end of track', () => {
    // a4 = 69 = 0x45 for a quarter (480 = 83 60), then a rest of 480 ticks
    // before c5 = 72 = 0x48 for an eighth (240 = 81 70).
    expect(text).toContain(
      '00 90 45 64 83 60 80 45 00 83 60 90 48 64 81 70 80 48 00 00 ff 2f 00',
    );
  });
});
