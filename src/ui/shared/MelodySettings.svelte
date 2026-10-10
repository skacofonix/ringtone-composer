<script lang="ts">
  import { MAX_BPM, MIN_BPM, setBpm, setName } from '../../core/editor';
  import { i18n } from '../../i18n/i18n.svelte';
  import type { Composition } from './composition.svelte';

  interface Props {
    composition: Composition;
  }

  let { composition }: Props = $props();

  /** The slider stops at a usable value; RTTTL imports may go up to MAX_BPM. */
  const SLIDER_MAX_BPM = Math.min(MAX_BPM, 400);
</script>

<div class="settings">
  <label class="name">
    <span>{i18n.t.settings.name}</span>
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
        composition.edit((s) => setBpm(s, bpm));
      }}
    />
  </label>
</div>

<style>
  .settings {
    display: flex;
    gap: 0.75rem;
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
