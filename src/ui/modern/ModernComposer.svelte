<script lang="ts">
  import {
    clearNotes,
    deleteBackward,
    insertNote,
    moveCursor,
    setCursor,
  } from '../../core/editor';
  import {
    rest,
    tone,
    type Duration,
    type Note,
    type PitchClass,
  } from '../../core/melody';
  import { i18n } from '../../i18n/i18n.svelte';
  import type { Composition } from '../shared/composition.svelte';
  import MelodySettings from '../shared/MelodySettings.svelte';
  import RtttlPanel from '../shared/RtttlPanel.svelte';
  import DurationPicker from './DurationPicker.svelte';
  import Piano from './Piano.svelte';
  import Score from './Score.svelte';

  interface Props {
    composition: Composition;
  }

  let { composition }: Props = $props();

  const t = $derived(i18n.t.modern);

  /** RTTTL octaves 4 to 7: the piano shows two of them. */
  const MIN_BASE_OCTAVE = 4;
  const MAX_BASE_OCTAVE = 6;

  let duration = $state<Duration>(8);
  let dotted = $state(false);
  let baseOctave = $state(5);

  function add(note: Note) {
    composition.edit((s) => insertNote(s, note));
    composition.preview(note);
  }

  function onpress(pitch: PitchClass, octave: number) {
    add(tone(pitch, octave, duration, dotted));
  }

  function clearAll() {
    if (confirm(i18n.t.common.clearAllConfirm)) composition.edit(clearNotes);
  }
</script>

<div class="composer">
  <MelodySettings {composition} />

  <Score
    notes={composition.melody.notes}
    cursor={composition.editor.cursor}
    playingIndex={composition.playingIndex}
    onselect={(cursor) => composition.edit((s) => setCursor(s, cursor))}
  />

  <div class="toolbar">
    <button
      type="button"
      aria-label={t.cursorLeft}
      onclick={() => composition.edit((s) => moveCursor(s, -1))}>◀</button
    >
    <button
      type="button"
      aria-label={t.cursorRight}
      onclick={() => composition.edit((s) => moveCursor(s, 1))}>▶</button
    >
    <button type="button" onclick={() => add(rest(duration, dotted))}
      >{t.rest}</button
    >
    <button
      type="button"
      aria-label={t.deleteNote}
      onclick={() => composition.edit(deleteBackward)}>⌫</button
    >
    <button
      type="button"
      class="danger"
      disabled={composition.melody.notes.length === 0}
      onclick={clearAll}>{t.clearAll}</button
    >
  </div>

  <DurationPicker bind:duration bind:dotted />

  <div class="octave" role="group" aria-label={t.keyboardOctaves}>
    <button
      type="button"
      aria-label={t.lowerOctave}
      disabled={baseOctave <= MIN_BASE_OCTAVE}
      onclick={() => baseOctave--}>−</button
    >
    <span>{t.octaves(baseOctave, baseOctave + 1)}</span>
    <button
      type="button"
      aria-label={t.higherOctave}
      disabled={baseOctave >= MAX_BASE_OCTAVE}
      onclick={() => baseOctave++}>+</button
    >
  </div>

  <Piano {baseOctave} {onpress} />

  <button
    type="button"
    class="play"
    disabled={composition.melody.notes.length === 0}
    onclick={() => composition.togglePlay()}
  >
    {composition.playing
      ? `■ ${i18n.t.common.stop}`
      : `▶ ${i18n.t.common.play}`}
  </button>

  <RtttlPanel {composition} />
</div>

<style>
  .composer {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  button {
    font: inherit;
    padding: 0.45rem 0.6rem;
    border: 1px solid var(--border);
    border-radius: 0.4rem;
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
    touch-action: manipulation;
  }

  button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .toolbar {
    display: flex;
    gap: 0.25rem;
  }

  .toolbar .danger {
    margin-left: auto;
    color: var(--danger);
  }

  .octave {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    font-size: 0.9rem;
  }

  .octave button {
    width: 2.5rem;
    font-weight: 700;
  }

  .play {
    padding: 0.8rem;
    font-weight: 600;
    border: 0;
    background: var(--accent);
    color: var(--on-accent);
  }
</style>
