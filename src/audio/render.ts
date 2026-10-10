/**
 * Offline rendering of a melody to PCM samples, for audio export. Same
 * synthesizer as live playback, but faster than real time.
 */
import type { Melody } from '../core/melody';
import { INSTRUMENTS, type InstrumentId } from './instruments';
import { scheduleDuration, scheduleMelody } from './schedule';
import { createOutput, playSchedule } from './synth';

export const EXPORT_SAMPLE_RATE = 44_100;

/** Louder than live playback: a ringtone file must ring. The limiter guards peaks. */
const EXPORT_VOLUME = 0.5;

/** Loudest sample of the exported file, just below full scale. */
const EXPORT_PEAK = 0.9;

/** Silence after the last sound, so that players do not cut it. */
const TAIL_SECONDS = 0.2;

/** Renders a melody as mono samples in [-1, 1]. */
export async function renderMelody(
  melody: Melody,
  instrument: InstrumentId,
  sampleRate = EXPORT_SAMPLE_RATE,
): Promise<Float32Array> {
  const schedule = scheduleMelody(melody);
  const instrumentSpec = INSTRUMENTS[instrument];

  // The buffer length must be known before rendering: the last voice ends
  // after its release.
  const lastNote = schedule.findLast((n) => n.frequency !== null);
  const melodyEnd = scheduleDuration(schedule);
  const soundEnd = lastNote
    ? lastNote.start + lastNote.soundDuration + instrumentSpec.envelope.release
    : 0;
  const seconds = Math.max(melodyEnd, soundEnd) + TAIL_SECONDS;

  const context = new OfflineAudioContext(
    1,
    Math.ceil(seconds * sampleRate),
    sampleRate,
  );
  const output = createOutput(context, EXPORT_VOLUME);
  playSchedule(context, output, instrumentSpec, schedule, 0);

  const buffer = await context.startRendering();
  return normalize(buffer.getChannelData(0), EXPORT_PEAK);
}

/**
 * Scales samples so that the loudest one reaches `peak`: every instrument
 * gives an equally loud ringtone, and nothing clips.
 */
export function normalize(samples: Float32Array, peak: number): Float32Array {
  let max = 0;
  for (const sample of samples) max = Math.max(max, Math.abs(sample));
  if (max === 0) return samples;
  const factor = peak / max;
  return samples.map((sample) => sample * factor);
}
