/**
 * Offline rendering of a melody to PCM samples, for audio export. Same
 * buzzer as live playback, but faster than real time.
 */
import type { Melody } from '../core/melody';
import { createBuzzer, scheduleMelodyOn } from './buzzer';
import { scheduleDuration, scheduleMelody } from './schedule';

export const EXPORT_SAMPLE_RATE = 44_100;

/** Louder than live playback: a ringtone file must ring. Leaves headroom. */
const EXPORT_VOLUME = 0.5;

/** Silence after the last note, so that players do not cut it. */
const TAIL_SECONDS = 0.2;

/** Renders a melody as mono samples in [-1, 1]. */
export async function renderMelody(
  melody: Melody,
  sampleRate = EXPORT_SAMPLE_RATE,
): Promise<Float32Array> {
  const schedule = scheduleMelody(melody);
  const seconds = scheduleDuration(schedule) + TAIL_SECONDS;
  const context = new OfflineAudioContext(
    1,
    Math.ceil(seconds * sampleRate),
    sampleRate,
  );

  const buzzer = createBuzzer(context, 0);
  const end = scheduleMelodyOn(buzzer, schedule, 0, EXPORT_VOLUME);
  buzzer.oscillator.start(0);
  buzzer.oscillator.stop(end);

  const buffer = await context.startRendering();
  return buffer.getChannelData(0);
}
