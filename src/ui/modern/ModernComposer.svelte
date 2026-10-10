<script lang="ts">
  import {
    clearNotes,
    deleteBackward,
    insertNote,
    MAX_BPM,
    MIN_BPM,
    moveCursor,
    setBpm,
    setCursor,
    setName,
  } from '../../core/editor';
  import {
    rest,
    tone,
    type Duration,
    type Note,
    type PitchClass,
  } from '../../core/melody';
  import type { Composition } from '../shared/composition.svelte';
  import RtttlPanel from '../shared/RtttlPanel.svelte';
  import DurationPicker from './DurationPicker.svelte';
  import Piano from './Piano.svelte';
  import Score from './Score.svelte';

  interface Props {
    composition: Composition;
  }

  let { composition }: Props = $props();

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
    if (confirm('Effacer toutes les notes ?')) composition.edit(clearNotes);
  }
</script>

<div class="composer">
  <div class="settings">
    <label class="name">
      <span>Nom</span>
      <input
        type="text"
        value={composition.melody.name}
        oninput={(e) => {
          const name = e.currentTarget.value;
          composition.edit((s) => setName(s, name));
        }}
      />
    </label>
    <label class="tempo">
      <span>Tempo <strong>{composition.melody.bpm}</strong></span>
      <input
        type="range"
        min={MIN_BPM}
        max={Math.min(MAX_BPM, 400)}
        value={composition.melody.bpm}
        oninput={(e) => {
          const bpm = e.currentTarget.valueAsNumber;
          composition.edit((s) => setBpm(s, bpm));
        }}
      />
    </label>
  </div>

  <Score
    notes={composition.melody.notes}
    cursor={composition.editor.cursor}
    playingIndex={composition.playingIndex}
    onselect={(cursor) => composition.edit((s) => setCursor(s, cursor))}
  />

  <div class="toolbar">
    <button
      type="button"
      aria-label="Curseur à gauche"
      onclick={() => composition.edit((s) => moveCursor(s, -1))}>◀</button
    >
    <button
      type="button"
      aria-label="Curseur à droite"
      onclick={() => composition.edit((s) => moveCursor(s, 1))}>▶</button
    >
    <button type="button" onclick={() => add(rest(duration, dotted))}
      >Silence</button
    >
    <button
      type="button"
      aria-label="Effacer la note avant le curseur"
      onclick={() => composition.edit(deleteBackward)}>⌫</button
    >
    <button
      type="button"
      class="danger"
      disabled={composition.melody.notes.length === 0}
      onclick={clearAll}>Tout effacer</button
    >
  </div>

  <DurationPicker bind:duration bind:dotted />

  <div class="octave" role="group" aria-label="Octaves du clavier">
    <button
      type="button"
      aria-label="Octave plus grave"
      disabled={baseOctave <= MIN_BASE_OCTAVE}
      onclick={() => baseOctave--}>−</button
    >
    <span>Octaves {baseOctave}–{baseOctave + 1}</span>
    <button
      type="button"
      aria-label="Octave plus aiguë"
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
    {composition.playing ? '■ Stop' : '▶ Jouer'}
  </button>

  <RtttlPanel {composition} />
</div>

<style>
  .composer {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .settings {
    display: flex;
    gap: 0.75rem;
  }

  .settings label {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 0.85rem;
    color: var(--muted);
  }

  .name {
    flex: 1.4;
    min-width: 0;
  }

  .tempo {
    flex: 1;
    min-width: 0;
  }

  .tempo strong {
    color: var(--text);
  }

  input[type='text'] {
    width: 100%;
    padding: 0.4rem 0.5rem;
    font: inherit;
    font-size: 1rem;
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 0.4rem;
    background: var(--surface);
  }

  input[type='range'] {
    width: 100%;
    margin: 0.55rem 0 0;
    accent-color: var(--accent);
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
