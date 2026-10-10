/**
 * The "buzzer": one square-wave oscillator whose frequency and volume are
 * automated note by note. Works on a live AudioContext (playback) and on an
 * OfflineAudioContext (export).
 */
import { scheduleDuration, type ScheduledNote } from './schedule';

/** Fade in/out of each note, to avoid clicks. */
const RAMP_SECONDS = 0.003;

export interface Buzzer {
  readonly oscillator: OscillatorNode;
  readonly gain: GainNode;
}

/** A silent square-wave oscillator, ready to receive scheduled tones. */
export function createBuzzer(context: BaseAudioContext, t0: number): Buzzer {
  const gain = context.createGain();
  gain.gain.setValueAtTime(0, t0);
  gain.connect(context.destination);

  const oscillator = context.createOscillator();
  oscillator.type = 'square';
  oscillator.connect(gain);
  return { oscillator, gain };
}

/** Schedules one tone, with short fades to avoid clicks. */
export function scheduleTone(
  { oscillator, gain }: Buzzer,
  frequency: number,
  start: number,
  seconds: number,
  volume: number,
): void {
  const stop = start + seconds;
  const ramp = Math.min(RAMP_SECONDS, seconds / 4);
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + ramp);
  gain.gain.setValueAtTime(volume, stop - ramp);
  gain.gain.linearRampToValueAtTime(0, stop);
}

/** Schedules a whole melody from `t0`; returns the time it ends. */
export function scheduleMelodyOn(
  buzzer: Buzzer,
  schedule: readonly ScheduledNote[],
  t0: number,
  volume: number,
): number {
  for (const note of schedule) {
    if (note.frequency === null) continue;
    scheduleTone(
      buzzer,
      note.frequency,
      t0 + note.start,
      note.soundDuration,
      volume,
    );
  }
  return t0 + scheduleDuration(schedule);
}
