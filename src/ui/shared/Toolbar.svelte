<script lang="ts">
  import CatalogDialog from './CatalogDialog.svelte';
  import type { Composition } from './composition.svelte';
  import ExportDialog from './ExportDialog.svelte';
  import ShareDialog from './ShareDialog.svelte';

  interface Props {
    composition: Composition;
  }

  let { composition }: Props = $props();

  let catalogOpen = $state(false);
  let shareOpen = $state(false);
  let exportOpen = $state(false);

  function open(set: () => void) {
    composition.stop();
    set();
  }
</script>

<div class="toolbar">
  <button type="button" onclick={() => open(() => (catalogOpen = true))}>
    <span aria-hidden="true">♫</span> Classiques
  </button>
  <button
    type="button"
    disabled={composition.melody.notes.length === 0}
    onclick={() => open(() => (shareOpen = true))}
  >
    <span aria-hidden="true">↗</span> Partager
  </button>
  <button
    type="button"
    disabled={composition.melody.notes.length === 0}
    onclick={() => open(() => (exportOpen = true))}
  >
    <span aria-hidden="true">☎</span> Sonnerie
  </button>
</div>

<CatalogDialog bind:open={catalogOpen} {composition} />
<ShareDialog bind:open={shareOpen} {composition} />
<ExportDialog bind:open={exportOpen} {composition} />

<style>
  .toolbar {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.4rem;
  }

  button {
    padding: 0.55rem 0.3rem;
    font: inherit;
    font-size: 0.9rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
    white-space: nowrap;
  }

  button:disabled {
    opacity: 0.45;
    cursor: default;
  }

  span {
    color: var(--accent);
  }
</style>
