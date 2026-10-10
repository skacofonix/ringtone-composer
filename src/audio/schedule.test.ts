import { describe, expect, it } from 'vitest';
import { rest, tone, type Melody } from '../core/melody';
import { noteIndexAt, scheduleDuration, scheduleMelody } from './schedule';

// At 120 BPM a quarter note lasts 0.5 s.
const melody: Melody = {
  name: 'test',
  bpm: 120,
  notes: [tone('a', 4, 4), rest(8), tone('a', 5, 2, true)],
};

describe('scheduleMelody', () => {
  const schedule = scheduleMelody(melody);

  it('places notes one after the other', () => {
    expect(schedule.map((n) => n.start)).toEqual([0, 0.5, 0.75]);
    expect(schedule.map((n) => n.duration)).toEqual([0.5, 0.25, 1.5]);
  });

  it('computes frequencies, null for rests', () => {
    expect(schedule.map((n) => n.frequency)).toEqual([440, null, 880]);
  });

  it('leaves a short articulation gap after each tone', () => {
    expect(schedule[0]!.soundDuration).toBeCloseTo(0.48);
    expect(schedule[1]!.soundDuration).toBe(0);
  });

  it('caps the gap to a fraction of very short notes', () => {
    const fast = scheduleMelody({
      name: '',
      bpm: 900,
      notes: [tone('c', 5, 32)],
    });
    const note = fast[0]!;
    expect(note.soundDuration).toBeCloseTo(note.duration * 0.9);
  });

  it('computes the total duration', () => {
    expect(scheduleDuration(schedule)).toBe(2.25);
    expect(scheduleDuration([])).toBe(0);
  });
});

describe('noteIndexAt', () => {
  const schedule = scheduleMelody(melody);

  it('finds the playing note', () => {
    expect(noteIndexAt(schedule, 0)).toBe(0);
    expect(noteIndexAt(schedule, 0.6)).toBe(1);
    expect(noteIndexAt(schedule, 2)).toBe(2);
  });

  it('returns -1 outside the melody', () => {
    expect(noteIndexAt(schedule, -0.1)).toBe(-1);
    expect(noteIndexAt(schedule, 2.25)).toBe(-1);
  });
});
