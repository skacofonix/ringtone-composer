/**
 * Plays notes with an instrument of instruments.ts: one voice per note
 * (oscillators → envelope → shared output). Works on a live AudioContext
 * (playback) and on an OfflineAudioContext (export).
 */
import {
  heldLevel,
  pulseWaveCoefficients,
  TIME_CONSTANT_RATIO,
  type Instrument,
  type Waveform,
} from './instruments';
import { scheduleDuration, type ScheduledNote } from './schedule';

export interface Output {
  /** Voices connect here. */
  readonly input: GainNode;
  /** Stops every voice quickly, without a click. */
  fadeOut(): void;
  disconnect(): void;
}

/**
 * Master volume followed by a limiter, so that overlapping notes (bells,
 * pianos) never clip.
 */
export function createOutput(
  context: BaseAudioContext,
  volume: number,
): Output {
  const input = context.createGain();
  input.gain.value = volume;
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -3;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.1;
  input.connect(limiter);
  limiter.connect(context.destination);
  return {
    input,
    fadeOut: () => input.gain.setTargetAtTime(0, context.currentTime, 0.01),
    disconnect: () => {
      input.disconnect();
      limiter.disconnect();
    },
  };
}

const pulseWaves = new WeakMap<BaseAudioContext, PeriodicWave>();

function setWaveform(
  context: BaseAudioContext,
  oscillator: OscillatorNode,
  waveform: Waveform,
): void {
  if (waveform !== 'pulse25') {
    oscillator.type = waveform;
    return;
  }
  let wave = pulseWaves.get(context);
  if (!wave) {
    const { real, imag } = pulseWaveCoefficients(0.25);
    wave = context.createPeriodicWave(real, imag);
    pulseWaves.set(context, wave);
  }
  oscillator.setPeriodicWave(wave);
}

/**
 * Schedules one note. `seconds` is how long the key is held; the sound then
 * fades over the instrument's release. Returns the time the voice is silent.
 */
export function scheduleNote(
  context: BaseAudioContext,
  output: Output,
  instrument: Instrument,
  frequency: number,
  start: number,
  seconds: number,
): number {
  const { envelope: shape, gain: peak } = instrument;
  // A note shorter than the attack stops mid-ramp.
  const attack = Math.min(shape.attack, seconds);
  const noteEnd = start + seconds;
  const silentAt = noteEnd + shape.release;

  // Every stage starts from an explicit value: engines disagree on where a
  // setTargetAtTime starts after a ramp (some blow up), so nothing is implied.
  const envelope = context.createGain();
  const level = envelope.gain;
  level.setValueAtTime(0, start);
  level.linearRampToValueAtTime(
    peak * heldLevel(shape, attack),
    start + attack,
  );
  if (shape.sustain < 1 && shape.decay > 0 && seconds > attack) {
    level.setValueAtTime(peak, start + attack);
    level.setTargetAtTime(
      peak * shape.sustain,
      start + attack,
      shape.decay / TIME_CONSTANT_RATIO,
    );
  }
  level.setValueAtTime(peak * heldLevel(shape, seconds), noteEnd);
  level.linearRampToValueAtTime(0, silentAt);
  envelope.connect(output.input);

  const sources: OscillatorNode[] = [];
  const carriers: OscillatorNode[] = [];
  for (const partial of instrument.partials) {
    const oscillator = context.createOscillator();
    setWaveform(context, oscillator, partial.waveform);
    oscillator.frequency.value = frequency * partial.ratio;
    const partialGain = context.createGain();
    partialGain.gain.value = partial.level;
    oscillator.connect(partialGain).connect(envelope);
    sources.push(oscillator);
    carriers.push(oscillator);
  }

  if (instrument.fm) {
    const { ratio, index, decay: fmDecay } = instrument.fm;
    const modulator = context.createOscillator();
    modulator.frequency.value = frequency * ratio;
    const depth = context.createGain();
    depth.gain.setValueAtTime(frequency * index, start);
    depth.gain.setTargetAtTime(frequency * index * 0.1, start, fmDecay);
    modulator.connect(depth);
    for (const carrier of carriers) depth.connect(carrier.frequency);
    sources.push(modulator);
  }

  for (const source of sources) {
    source.start(start);
    source.stop(silentAt);
  }
  // No `onended` cleanup per voice: in offline rendering, each event forces a
  // round trip to the main thread. Output.disconnect() frees everything.

  return silentAt;
}

/** Schedules a whole melody from `t0`. Returns the time the last voice is silent. */
export function playSchedule(
  context: BaseAudioContext,
  output: Output,
  instrument: Instrument,
  schedule: readonly ScheduledNote[],
  t0: number,
): number {
  let silentAt = t0 + scheduleDuration(schedule);
  for (const note of schedule) {
    if (note.frequency === null) continue;
    const end = scheduleNote(
      context,
      output,
      instrument,
      note.frequency,
      t0 + note.start,
      note.soundDuration,
    );
    silentAt = Math.max(silentAt, end);
  }
  return silentAt;
}
