<script lang="ts">
  import { serializeRtttl } from './core/rtttl';
  import { melodyFromUrl } from './core/share';
  import { i18n } from './i18n/i18n.svelte';
  import { LOCALE_NAMES, LOCALES, isLocale } from './i18n/locale';
  import ModernComposer from './ui/modern/ModernComposer.svelte';
  import RetroComposer from './ui/retro/RetroComposer.svelte';
  import { Composition } from './ui/shared/composition.svelte';
  import { readSetting, writeSetting } from './ui/shared/storage';
  import Toolbar from './ui/shared/Toolbar.svelte';

  type Mode = 'retro' | 'modern';

  const MODES: Mode[] = ['retro', 'modern'];

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
      confirm(i18n.t.app.openShared(shared.name, current.name));
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
    <div class="controls">
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
      <select
        class="language"
        aria-label={i18n.t.app.language}
        value={i18n.locale}
        onchange={(e) => {
          const locale = e.currentTarget.value;
          if (isLocale(locale)) i18n.setLocale(locale);
        }}
      >
        {#each LOCALES as locale (locale)}
          <option value={locale}>{LOCALE_NAMES[locale]}</option>
        {/each}
      </select>
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

  .controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .language {
    padding: 0.4rem 0.3rem;
    font: inherit;
    font-size: 0.9rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    background: var(--surface);
    color: var(--text);
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
