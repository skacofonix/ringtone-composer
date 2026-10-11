/**
 * The melody being composed and its playback, shared by the retro and modern
 * modes. Thin reactive wrapper: the editing logic lives in core/editor.ts.
 */
import {
  DEFAULT_INSTRUMENT,
  isInstrumentId,
  type InstrumentId,
} from '../../audio/instruments';
import { MelodyPlayer } from '../../audio/player';
import { createEditor, type EditorState } from '../../core/editor';
import {
  canRedo,
  canUndo,
  createHistory,
  record,
  redo,
  undo,
  type History,
} from '../../core/history';
import {
  durationMs,
  frequency,
  type Melody,
  type Note,
} from '../../core/melody';
import { parseRtttl } from '../../core/rtttl';
import {
  loadSavedMelody,
  readSetting,
  saveMelody,
  writeSetting,
} from './storage';

const INSTRUMENT_SETTING = 'instrument';

function savedInstrument(): InstrumentId {
  const saved = readSetting(INSTRUMENT_SETTING);
  return isInstrumentId(saved) ? saved : DEFAULT_INSTRUMENT;
}

/** A key press should not ring for the whole length of a whole note. */
const MAX_PREVIEW_SECONDS = 0.4;

const DEFAULT_RTTTL =
  'Nokia Tune:d=4,o=5,b=225:8e6,8d6,f#,g#,8c#6,8b,d,e,8b,8a,c#,e,2a';

export class Composition {
  /**
   * Immutable editor states with undo / redo, replaced on each edit (hence
   * `$state.raw`). The current state is `history.present`.
   */
  #history = $state.raw<History<EditorState>>(
    createHistory(createEditor(loadSavedMelody() ?? parseRtttl(DEFAULT_RTTTL))),
  );
  /** Instrument used for playback, previews and the audio export. */
  instrument = $state<InstrumentId>(savedInstrument());
  playing = $state(false);
  /** Index of the note being played, -1 when nothing plays. */
  playingIndex = $state(-1);

  readonly #player = new MelodyPlayer();

  get editor(): EditorState {
    return this.#history.present;
  }

  get melody(): Melody {
    return this.editor.melody;
  }

  get canUndo(): boolean {
    return canUndo(this.#history);
  }

  get canRedo(): boolean {
    return canRedo(this.#history);
  }

  /**
   * Applies an editing operation from core/editor.ts. Stops playback.
   * Consecutive edits of the same `group` (e.g. typing the name) are undone
   * in one step.
   */
  edit(
    operation: (state: EditorState) => EditorState,
    group: string | null = null,
  ): void {
    this.stop();
    this.#setHistory(record(this.#history, operation(this.editor), group));
  }

  /** Replaces the whole melody (import, catalog…). Can be undone. */
  load(melody: Melody, group: string | null = null): void {
    this.stop();
    this.#setHistory(record(this.#history, createEditor(melody), group));
  }

  undo(): void {
    this.stop();
    this.#setHistory(undo(this.#history));
  }

  redo(): void {
    this.stop();
    this.#setHistory(redo(this.#history));
  }

  /** Every change goes through here, so that it is saved automatically. */
  #setHistory(history: History<EditorState>): void {
    if (history === this.#history) return;
    this.#history = history;
    saveMelody(history.present.melody);
  }

  setInstrument(instrument: InstrumentId): void {
    this.stop();
    this.instrument = instrument;
    writeSetting(INSTRUMENT_SETTING, instrument);
  }

  togglePlay(): void {
    if (this.playing) {
      this.stop();
      return;
    }
    if (this.melody.notes.length === 0) return;
    this.playing = true;
    void this.#player.play(this.melody, this.instrument, {
      onNote: (index) => (this.playingIndex = index),
      onEnd: () => (this.playing = false),
    });
  }

  /**
   * Plays a melody without loading it (catalog preview). The editor's
   * playing state is not touched.
   */
  audition(melody: Melody, onEnd: () => void): void {
    this.stop();
    void this.#player.play(melody, this.instrument, { onEnd });
  }

  stop(): void {
    this.#player.stop();
  }

  /**
   * Plays a single note at the current tempo, e.g. on key press, with the
   * current instrument or another one (to try it before choosing).
   */
  preview(note: Note, instrument: InstrumentId = this.instrument): void {
    if (note.kind !== 'tone') return;
    const seconds = durationMs(note, this.melody.bpm) / 1000;
    void this.#player.preview(
      frequency(note),
      Math.min(seconds, MAX_PREVIEW_SECONDS),
      instrument,
    );
  }
}
