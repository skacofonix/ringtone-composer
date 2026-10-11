<script lang="ts">
  import { noteBeforeCursor, updateNoteBeforeCursor } from '../../core/editor';
  import {
    canBeSharp,
    MAX_EDIT_OCTAVE,
    MIN_EDIT_OCTAVE,
    shiftDuration,
    shiftOctave,
    toggleDotted,
    toggleSharp,
    type Note,
  } from '../../core/melody';
  import { i18n } from '../../i18n/i18n.svelte';
  import type { Composition } from '../shared/composition.svelte';
  import { durationLabel, noteName } from './format';

  interface Props {
    composition: Composition;
  }

  let { composition }: Props = $props();

  const t = $derived(i18n.t.modern.edit);

  /** The current note: the one just before the cursor, as in retro mode. */
  const note = $derived(noteBeforeCursor(composition.editor));

  function update(change: (note: Note) => Note) {
    composition.edit((s) => updateNoteBeforeCursor(s, change));
    const edited = noteBeforeCursor(composition.editor);
    if (edited) composition.preview(edited);
  }
</script>

{#if note}
  <div class="editor" role="group" aria-label={t.label}>
    <span class="name">{noteName(note)}</span>

    <div class="length">
      <button
        type="button"
        aria-label={t.shorter}
        disabled={note.duration === 32}
        onclick={() => update((n) => shiftDuration(n, 1))}>−</button
      >
      <span>{durationLabel(note.duration)}</span>
      <button
        type="button"
        aria-label={t.longer}
        disabled={note.duration === 1}
        onclick={() => update((n) => shiftDuration(n, -1))}>+</button
      >
    </div>

    <button
      type="button"
      aria-label={t.dotted}
      aria-pressed={note.dotted}
      onclick={() => update(toggleDotted)}>•</button
    >
    <button
      type="button"
      aria-label={t.sharp}
      aria-pressed={note.kind === 'tone' && note.pitch.endsWith('#')}
      disabled={!canBeSharp(note)}
      onclick={() => update((n) => (n.kind === 'tone' ? toggleSharp(n) : n))}
      >♯</button
    >
    <button
      type="button"
      aria-label={t.octaveDown}
      disabled={note.kind !== 'tone' || note.octave <= MIN_EDIT_OCTAVE}
      onclick={() =>
        update((n) => (n.kind === 'tone' ? shiftOctave(n, -1) : n))}>↓</button
    >
    <button
      type="button"
      aria-label={t.octaveUp}
      disabled={note.kind !== 'tone' || note.octave >= MAX_EDIT_OCTAVE}
      onclick={() => update((n) => (n.kind === 'tone' ? shiftOctave(n, 1) : n))}
      >↑</button
    >
  </div>
{/if}

<style>
  .editor {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.35rem 0.4rem;
    border: 1px solid var(--accent);
    border-radius: 0.6rem;
    background: var(--surface);
  }

  .name {
    min-width: 2.6rem;
    font-weight: 700;
    text-align: center;
  }

  .length {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    margin-right: auto;
  }

  .length span {
    min-width: 2.4rem;
    text-align: center;
    font-size: 0.9rem;
  }

  button {
    min-width: 2.1rem;
    padding: 0.35rem 0.45rem;
    font: inherit;
    font-weight: 700;
    border: 1px solid var(--border);
    border-radius: 0.4rem;
    background: var(--bg);
    color: var(--text);
    cursor: pointer;
    touch-action: manipulation;
  }

  button[aria-pressed='true'] {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--on-accent);
  }

  button:disabled {
    opacity: 0.35;
    cursor: default;
  }
</style>
