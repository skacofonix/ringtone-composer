/**
 * The melody being composed and its playback, shared by the retro and modern
 * modes. Thin reactive wrapper: the editing logic lives in core/editor.ts.
 */
import { MelodyPlayer } from '../../audio/player';
import { createEditor, type EditorState } from '../../core/editor';
import {
  durationMs,
  frequency,
  type Melody,
  type Note,
} from '../../core/melody';
import { parseRtttl } from '../../core/rtttl';
import { loadSavedMelody, saveMelody } from './storage';

/** A key press should not ring for the whole length of a whole note. */
const MAX_PREVIEW_SECONDS = 0.4;

const DEFAULT_RTTTL =
  'Nokia Tune:d=4,o=5,b=225:8e6,8d6,f#,g#,8c#6,8b,d,e,8b,8a,c#,e,2a';

export class Composition {
  /** Immutable editor state, replaced on each edit (hence `$state.raw`). */
  editor = $state.raw<EditorState>(
    createEditor(loadSavedMelody() ?? parseRtttl(DEFAULT_RTTTL)),
  );
  playing = $state(false);
  /** Index of the note being played, -1 when nothing plays. */
  playingIndex = $state(-1);

  readonly #player = new MelodyPlayer();

  get melody(): Melody {
    return this.editor.melody;
  }

  /** Applies an editing operation from core/editor.ts. Stops playback. */
  edit(operation: (state: EditorState) => EditorState): void {
    this.stop();
    this.#update(operation(this.editor));
  }

  /** Replaces the whole melody (import, catalog…). */
  load(melody: Melody): void {
    this.stop();
    this.#update(createEditor(melody));
  }

  /** Every change goes through here, so that it is saved automatically. */
  #update(editor: EditorState): void {
    if (editor === this.editor) return;
    this.editor = editor;
    saveMelody(editor.melody);
  }

  togglePlay(): void {
    if (this.playing) {
      this.stop();
      return;
    }
    if (this.melody.notes.length === 0) return;
    this.playing = true;
    void this.#player.play(this.melody, {
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
    void this.#player.play(melody, { onEnd });
  }

  stop(): void {
    this.#player.stop();
  }

  /** Plays a single note at the current tempo, e.g. on key press. */
  preview(note: Note): void {
    if (note.kind !== 'tone') return;
    const seconds = durationMs(note, this.melody.bpm) / 1000;
    void this.#player.preview(
      frequency(note),
      Math.min(seconds, MAX_PREVIEW_SECONDS),
    );
  }
}
