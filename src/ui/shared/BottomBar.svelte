<script lang="ts">
  import { i18n } from '../../i18n/i18n.svelte';
  import CatalogDialog from './CatalogDialog.svelte';
  import type { Composition } from './composition.svelte';
  import ExportDialog from './ExportDialog.svelte';
  import Icon from './Icon.svelte';
  import MoreMenu from './MoreMenu.svelte';
  import { isApplePlatform } from './platform';
  import ShareDialog from './ShareDialog.svelte';

  interface Props {
    composition: Composition;
  }

  let { composition }: Props = $props();

  const shareIcon = isApplePlatform() ? 'shareBox' : 'shareNodes';

  let catalogOpen = $state(false);
  let shareOpen = $state(false);
  let exportOpen = $state(false);
  let moreOpen = $state(false);

  const t = $derived(i18n.t.toolbar);
  const empty = $derived(composition.melody.notes.length === 0);

  function open(set: () => void) {
    composition.stop();
    set();
  }
</script>

<nav class="bar">
  <button type="button" onclick={() => open(() => (catalogOpen = true))}>
    <Icon name="music" />
    <span>{t.classics}</span>
  </button>
  <button
    type="button"
    disabled={empty}
    onclick={() => open(() => (shareOpen = true))}
  >
    <Icon name={shareIcon} />
    <span>{t.share}</span>
  </button>
  <button
    type="button"
    class="play"
    disabled={empty}
    onclick={() => composition.togglePlay()}
  >
    <span class="disc">
      <Icon name={composition.playing ? 'stop' : 'play'} size={24} />
    </span>
    <span>{composition.playing ? i18n.t.common.stop : i18n.t.common.play}</span>
  </button>
  <button
    type="button"
    disabled={empty}
    onclick={() => open(() => (exportOpen = true))}
  >
    <Icon name="bell" />
    <span>{t.ringtone}</span>
  </button>
  <button type="button" onclick={() => open(() => (moreOpen = true))}>
    <Icon name="menu" />
    <span>{t.more}</span>
  </button>
</nav>

<CatalogDialog bind:open={catalogOpen} {composition} />
<ShareDialog bind:open={shareOpen} {composition} />
<ExportDialog bind:open={exportOpen} {composition} />
<MoreMenu bind:open={moreOpen} {composition} />

<style>
  .bar {
    position: fixed;
    inset: auto 0 0;
    z-index: 10;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    align-items: end;
    max-width: 40rem;
    margin: 0 auto;
    padding: 0.35rem 0.25rem calc(0.5rem + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid var(--border);
    background: var(--surface);
  }

  button {
    display: grid;
    justify-items: center;
    gap: 0.15rem;
    min-width: 0;
    padding: 0.3rem 0;
    font: inherit;
    font-size: 0.7rem;
    border: 0;
    background: none;
    color: var(--muted);
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  button > :global(svg) {
    color: var(--text);
  }

  button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  span {
    max-width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  /* The main action rises above the bar. */
  .play {
    margin-top: -1.4rem;
  }

  .disc {
    display: grid;
    place-items: center;
    width: 3.4rem;
    height: 3.4rem;
    border-radius: 50%;
    background: var(--accent);
    color: var(--on-accent);
    box-shadow: 0 0.25rem 0.7rem rgb(0 0 0 / 0.35);
  }
</style>
