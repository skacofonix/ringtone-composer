/**
 * Real-time playback with the Web Audio API: a single square-wave oscillator,
 * like the piezo buzzer of the Nokia phones of the 2000s.
 */
import type { Melody } from '../core/melody';
import { noteIndexAt, scheduleDuration, scheduleMelody } from './schedule';

export interface PlayOptions {
  /** Called when the playing note changes (-1 when nothing plays). */
  onNote?: (index: number) => void;
  /** Called once, when the melody ends or is stopped. */
  onEnd?: () => void;
}

/** Square waves are harsh: keep the master volume low. */
const VOLUME = 0.15;
/** Fade in/out of each note, to avoid clicks. */
const RAMP_SECONDS = 0.003;
/** Small delay before the first note, so scheduling never starts in the past. */
const START_DELAY_SECONDS = 0.05;

interface Playback {
  readonly oscillator: OscillatorNode;
  readonly options: PlayOptions;
  frame: number;
  finished: boolean;
}

export class MelodyPlayer {
  #context: AudioContext | null = null;
  #playback: Playback | null = null;
  /** Incremented by each play()/stop(), to drop a play() overtaken while awaiting. */
  #generation = 0;

  get playing(): boolean {
    return this.#playback !== null;
  }

  /**
   * Plays a melody, stopping the current one if any. Must be called from a
   * user gesture (tap, click) the first time, or browsers keep audio muted.
   */
  async play(melody: Melody, options: PlayOptions = {}): Promise<void> {
    this.stop();
    const generation = this.#generation;
    const context = await this.#ensureContext();
    if (generation !== this.#generation) return;

    const schedule = scheduleMelody(melody);
    const t0 = context.currentTime + START_DELAY_SECONDS;
    const end = t0 + scheduleDuration(schedule);

    const { oscillator, gain } = createBuzzer(context, t0);
    for (const note of schedule) {
      if (note.frequency === null) continue;
      scheduleTone(
        oscillator,
        gain,
        note.frequency,
        t0 + note.start,
        note.soundDuration,
      );
    }

    const playback: Playback = {
      oscillator,
      options,
      frame: 0,
      finished: false,
    };
    this.#playback = playback;

    oscillator.onended = () => {
      gain.disconnect();
      this.#finish(playback);
    };

    oscillator.start(t0);
    oscillator.stop(end);

    // Report progress on each animation frame, only when the note changes.
    let current = -1;
    const tick = () => {
      const index = noteIndexAt(schedule, context.currentTime - t0);
      if (index !== current) {
        current = index;
        options.onNote?.(index);
      }
      playback.frame = requestAnimationFrame(tick);
    };
    playback.frame = requestAnimationFrame(tick);
  }

  /**
   * Plays a single short note, e.g. when a key is pressed. Independent from
   * melody playback.
   */
  async preview(frequency: number, seconds: number): Promise<void> {
    const context = await this.#ensureContext();
    const t0 = context.currentTime;
    const { oscillator, gain } = createBuzzer(context, t0);
    scheduleTone(oscillator, gain, frequency, t0, seconds);
    oscillator.onended = () => gain.disconnect();
    oscillator.start(t0);
    oscillator.stop(t0 + seconds);
  }

  /** Stops the current melody. Does nothing if nothing plays. */
  stop(): void {
    this.#generation++;
    const playback = this.#playback;
    if (!playback) return;
    playback.oscillator.stop();
    // Notify synchronously: `onended` comes later, possibly after a new play().
    this.#finish(playback);
  }

  #finish(playback: Playback): void {
    if (playback.finished) return;
    playback.finished = true;
    cancelAnimationFrame(playback.frame);
    if (this.#playback === playback) this.#playback = null;
    playback.options.onNote?.(-1);
    playback.options.onEnd?.();
  }

  async #ensureContext(): Promise<AudioContext> {
    if (!this.#context) {
      allowPlaybackInSilentMode();
      this.#context = new AudioContext();
    }
    if (this.#context.state !== 'running') {
      await this.#context.resume();
    }
    return this.#context;
  }
}

/** A silent square-wave oscillator, ready to receive scheduled tones. */
function createBuzzer(
  context: AudioContext,
  t0: number,
): { oscillator: OscillatorNode; gain: GainNode } {
  const gain = context.createGain();
  gain.gain.setValueAtTime(0, t0);
  gain.connect(context.destination);

  const oscillator = context.createOscillator();
  oscillator.type = 'square';
  oscillator.connect(gain);
  return { oscillator, gain };
}

/** Schedules one tone, with short fades to avoid clicks. */
function scheduleTone(
  oscillator: OscillatorNode,
  gain: GainNode,
  frequency: number,
  start: number,
  seconds: number,
): void {
  const stop = start + seconds;
  const ramp = Math.min(RAMP_SECONDS, seconds / 4);
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(VOLUME, start + ramp);
  gain.gain.setValueAtTime(VOLUME, stop - ramp);
  gain.gain.linearRampToValueAtTime(0, stop);
}

/**
 * On iPhone, web audio is muted by the silent switch unless the page declares
 * itself as media playback (Safari 16.4+). Ignored by other browsers.
 */
function allowPlaybackInSilentMode(): void {
  const nav = navigator as Navigator & { audioSession?: { type: string } };
  if (nav.audioSession) nav.audioSession.type = 'playback';
}
