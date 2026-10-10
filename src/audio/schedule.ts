/**
 * Turns a melody into a timeline of sounds. Pure: shared by real-time
 * playback and (later) offline rendering for audio export.
 */
import { durationMs, frequency, type Melody } from '../core/melody';

export interface ScheduledNote {
  /** Index of the note in `melody.notes`. */
  readonly index: number;
  /** Start time in seconds, from the beginning of the melody. */
  readonly start: number;
  /** Time slot of the note in seconds (sound + articulation gap). */
  readonly duration: number;
  /** How long the buzzer actually sounds, in seconds. 0 for a rest. */
  readonly soundDuration: number;
  /** Frequency in Hz, `null` for a rest. */
  readonly frequency: number | null;
}

/**
 * Silence at the end of each note, so that repeated notes stay distinct,
 * like on the phones' buzzer. Capped for short notes.
 */
const MAX_GAP_SECONDS = 0.02;
const MAX_GAP_RATIO = 0.1;

export function scheduleMelody(melody: Melody): ScheduledNote[] {
  let start = 0;
  return melody.notes.map((note, index) => {
    const duration = durationMs(note, melody.bpm) / 1000;
    const gap = Math.min(MAX_GAP_SECONDS, duration * MAX_GAP_RATIO);
    const scheduled: ScheduledNote = {
      index,
      start,
      duration,
      soundDuration: note.kind === 'tone' ? duration - gap : 0,
      frequency: note.kind === 'tone' ? frequency(note) : null,
    };
    start += duration;
    return scheduled;
  });
}

/** Total length of a schedule in seconds. */
export function scheduleDuration(schedule: readonly ScheduledNote[]): number {
  const last = schedule.at(-1);
  return last ? last.start + last.duration : 0;
}

/** Index of the note playing at `time` seconds, or -1 outside the melody. */
export function noteIndexAt(
  schedule: readonly ScheduledNote[],
  time: number,
): number {
  if (time < 0) return -1;
  // Linear scan is fine: ringtones have at most a few hundred notes.
  for (const note of schedule) {
    if (time < note.start + note.duration) return note.index;
  }
  return -1;
}
