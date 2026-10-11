<script lang="ts">
  import { serializeRtttl } from './core/rtttl';
  import { isInstrumentId } from './audio/instruments';
  import { readSharedLink } from './core/share';
  import { i18n } from './i18n/i18n.svelte';
  import ModernComposer from './ui/modern/ModernComposer.svelte';
  import RetroComposer from './ui/retro/RetroComposer.svelte';
  import { Composition } from './ui/shared/composition.svelte';
  import BottomBar from './ui/shared/BottomBar.svelte';
  import Icon from './ui/shared/Icon.svelte';
  import MelodySummary from './ui/shared/MelodySummary.svelte';
  import { readSetting, writeSetting } from './ui/shared/storage';

  type Mode = 'retro' | 'modern';

  const MODES: Mode[] = ['retro', 'modern'];

  const composition = new Composition();
  let mode = $state<Mode>(
    readSetting('mode') === 'modern' ? 'modern' : 'retro',
  );

  /** Opens the melody of a shared link (`#rtttl=…`), then cleans the URL. */
  function openSharedLink() {
    const link = readSharedLink(location.href);
    if (!link) return;
    const shared = link.melody;
    const current = composition.melody;
    const replace =
      current.notes.length === 0 ||
      serializeRtttl(current) === serializeRtttl(shared) ||
      confirm(i18n.t.app.openShared(shared.name, current.name));
    if (replace) {
      composition.load(shared);
      if (isInstrumentId(link.instrument)) {
        composition.setInstrument(link.instrument);
      }
    }
    history.replaceState(null, '', location.pathname + location.search);
  }

  openSharedLink();

  /** Ctrl/Cmd+Z undoes, Ctrl+Y or Ctrl/Cmd+Shift+Z redoes. Text fields keep their own undo. */
  function onkeydown(event: KeyboardEvent) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable]')) return;
    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      composition.undo();
    } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
      event.preventDefault();
      composition.redo();
    }
  }

  function selectMode(next: Mode) {
    composition.stop();
    mode = next;
    writeSetting('mode', next);
  }
</script>

<svelte:window onhashchange={openSharedLink} {onkeydown} />

<main>
  <header>
    <h1>RingtoneComposer</h1>
    <div class="history">
      <button
        type="button"
        aria-label={i18n.t.app.undo}
        title={i18n.t.app.undo}
        disabled={!composition.canUndo}
        onclick={() => composition.undo()}
        ><Icon name="undo" size={20} /></button
      >
      <button
        type="button"
        aria-label={i18n.t.app.redo}
        title={i18n.t.app.redo}
        disabled={!composition.canRedo}
        onclick={() => composition.redo()}
        ><Icon name="redo" size={20} /></button
      >
    </div>
    <div class="modes" role="tablist" aria-label={i18n.t.app.modes}>
      {#each MODES as id (id)}
        <button
          type="button"
          role="tab"
          aria-selected={mode === id}
          onclick={() => selectMode(id)}>{i18n.t.app[id]}</button
        >
      {/each}
    </div>
  </header>

  <MelodySummary {composition} />

  {#if mode === 'retro'}
    <RetroComposer {composition} />
  {:else}
    <ModernComposer {composition} />
  {/if}
</main>

<BottomBar {composition} />

<style>
  main {
    max-width: 40rem;
    margin: 0 auto;
    /* Room for the fixed bottom bar and its raised play button. */
    padding: 1rem 1rem calc(6rem + env(safe-area-inset-bottom, 0px));
  }

  main > :global(.summary) {
    margin-bottom: 0.9rem;
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
    flex: 1;
    margin: 0;
    font-size: 1.3rem;
  }

  .history {
    display: flex;
    gap: 0.25rem;
  }

  .history button {
    display: grid;
    place-items: center;
    width: 2.3rem;
    height: 2.1rem;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
  }

  .history button:disabled {
    opacity: 0.35;
    cursor: default;
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
