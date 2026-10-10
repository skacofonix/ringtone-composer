<script lang="ts">
  import { serializeRtttl } from './core/rtttl';
  import { melodyFromUrl } from './core/share';
  import ModernComposer from './ui/modern/ModernComposer.svelte';
  import RetroComposer from './ui/retro/RetroComposer.svelte';
  import { Composition } from './ui/shared/composition.svelte';
  import { readSetting, writeSetting } from './ui/shared/storage';
  import Toolbar from './ui/shared/Toolbar.svelte';

  type Mode = 'retro' | 'modern';

  const MODES: { id: Mode; label: string }[] = [
    { id: 'retro', label: 'Rétro 3310' },
    { id: 'modern', label: 'Moderne' },
  ];

  const composition = new Composition();
  let mode = $state<Mode>(
    readSetting('mode') === 'modern' ? 'modern' : 'retro',
  );

  /** Opens the melody of a shared link (`#rtttl=…`), then cleans the URL. */
  function openSharedLink() {
    const shared = melodyFromUrl(location.href);
    if (!shared) return;
    const current = composition.melody;
    const replace =
      current.notes.length === 0 ||
      serializeRtttl(current) === serializeRtttl(shared) ||
      confirm(
        `Ouvrir la sonnerie partagée « ${shared.name} » ?\n` +
          `« ${current.name} » sera remplacée.`,
      );
    if (replace) composition.load(shared);
    history.replaceState(null, '', location.pathname + location.search);
  }

  openSharedLink();

  function selectMode(next: Mode) {
    composition.stop();
    mode = next;
    writeSetting('mode', next);
  }
</script>

<svelte:window onhashchange={openSharedLink} />

<main>
  <header>
    <h1>RingtoneComposer</h1>
    <div class="modes" role="tablist" aria-label="Mode de saisie">
      {#each MODES as { id, label } (id)}
        <button
          type="button"
          role="tab"
          aria-selected={mode === id}
          onclick={() => selectMode(id)}>{label}</button
        >
      {/each}
    </div>
  </header>

  <Toolbar {composition} />

  {#if mode === 'retro'}
    <RetroComposer {composition} />
  {:else}
    <ModernComposer {composition} />
  {/if}
</main>

<style>
  main {
    max-width: 40rem;
    margin: 0 auto;
    padding: 1rem 1rem 2rem;
  }

  main > :global(.toolbar) {
    margin-bottom: 1rem;
  }

  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem 1rem;
    margin-bottom: 1rem;
  }

  h1 {
    margin: 0;
    font-size: 1.3rem;
  }

  .modes {
    display: flex;
    padding: 0.2rem;
    border-radius: 0.6rem;
    background: var(--chip);
  }

  .modes button {
    padding: 0.35rem 0.8rem;
    font: inherit;
    font-size: 0.9rem;
    border: 0;
    border-radius: 0.45rem;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
  }

  .modes button[aria-selected='true'] {
    background: var(--surface);
    color: var(--text);
    font-weight: 600;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.15);
  }
</style>
