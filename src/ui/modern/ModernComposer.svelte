<script lang="ts">
  import { deleteBackward, insertNote, setCursor } from '../../core/editor';
  import {
    rest,
    tone,
    type Duration,
    type Note,
    type PitchClass,
  } from '../../core/melody';
  import { i18n } from '../../i18n/i18n.svelte';
  import type { Composition } from '../shared/composition.svelte';
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
</script>

<div class="composer">
  <Score
    notes={composition.melody.notes}
    cursor={composition.editor.cursor}
    playingIndex={composition.playingIndex}
    onselect={(cursor) => composition.edit((s) => setCursor(s, cursor))}
  />

  <div class="toolbar">
    <button type="button" onclick={() => add(rest(duration, dotted))}
      >{t.rest}</button
    >
    <button
      type="button"
      aria-label={t.deleteNote}
      onclick={() => composition.edit(deleteBackward)}>⌫</button
    >
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
  </div>

  <DurationPicker bind:duration bind:dotted />

  <Piano {baseOctave} {onpress} />
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
    align-items: center;
    gap: 0.25rem;
  }

  .octave {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-left: auto;
    font-size: 0.85rem;
    color: var(--muted);
    white-space: nowrap;
  }

  .octave button {
    width: 2.2rem;
    font-weight: 700;
  }
</style>
