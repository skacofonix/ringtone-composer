<script lang="ts">
  import { INSTRUMENT_IDS, isInstrumentId } from '../../audio/instruments';
  import { MAX_BPM, MIN_BPM, setBpm, setName } from '../../core/editor';
  import { tone } from '../../core/melody';
  import { i18n } from '../../i18n/i18n.svelte';
  import type { Composition } from './composition.svelte';

  interface Props {
    composition: Composition;
  }

  let { composition }: Props = $props();

  /** The slider stops at a usable value; RTTTL imports may go up to MAX_BPM. */
  const SLIDER_MAX_BPM = Math.min(MAX_BPM, 400);

  /** Played when an instrument is chosen, to hear it right away. */
  const DEMO_NOTE = tone('c', 5, 4);

  function chooseInstrument(value: string) {
    if (!isInstrumentId(value)) return;
    composition.setInstrument(value);
    composition.preview(DEMO_NOTE);
  }
</script>

<div class="settings">
  <label class="name">
    <span>{i18n.t.settings.name}</span>
    <input
      type="text"
      value={composition.melody.name}
      oninput={(e) => {
        const name = e.currentTarget.value;
        composition.edit((s) => setName(s, name), 'name');
      }}
    />
  </label>
  <label class="tempo">
    <span
      >{i18n.t.settings.tempo} <strong>{composition.melody.bpm}</strong></span
    >
    <input
      type="range"
      min={MIN_BPM}
      max={SLIDER_MAX_BPM}
      value={composition.melody.bpm}
      oninput={(e) => {
        const bpm = e.currentTarget.valueAsNumber;
        composition.edit((s) => setBpm(s, bpm), 'tempo');
      }}
    />
  </label>
  <label class="instrument">
    <span>{i18n.t.settings.instrument}</span>
    <select
      value={composition.instrument}
      onchange={(e) => chooseInstrument(e.currentTarget.value)}
    >
      {#each INSTRUMENT_IDS as id (id)}
        <option value={id}>{i18n.t.instruments[id]}</option>
      {/each}
    </select>
  </label>
</div>

<style>
  .settings {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem 0.75rem;
  }

  .instrument {
    flex-basis: 100%;
  }

  select {
    width: 100%;
    padding: 0.4rem 0.5rem;
    font: inherit;
    font-size: 1rem;
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 0.4rem;
    background: var(--surface);
  }

  label {
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
</style>
