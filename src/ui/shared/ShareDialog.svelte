<script lang="ts">
  import { shareUrl } from '../../core/share';
  import { i18n } from '../../i18n/i18n.svelte';
  import type { Composition } from './composition.svelte';
  import Dialog from './Dialog.svelte';

  interface Props {
    open: boolean;
    composition: Composition;
  }

  let { open = $bindable(), composition }: Props = $props();

  const t = $derived(i18n.t.share);

  let status = $state<'copied' | 'shareFailed' | 'copyFailed' | null>(null);

  const url = $derived(
    shareUrl(composition.melody, location.origin + location.pathname),
  );
  const canShare = typeof navigator.share === 'function';

  async function share() {
    try {
      await navigator.share({
        title: composition.melody.name,
        text: t.message(composition.melody.name),
        url,
      });
    } catch (e) {
      // AbortError: the user closed the share sheet.
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        status = 'shareFailed';
      }
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      status = 'copied';
    } catch {
      status = 'copyFailed';
    }
  }
</script>

<Dialog bind:open title={t.title}>
  <p>{t.intro(composition.melody.name)}</p>
  <input
    type="text"
    readonly
    value={url}
    aria-label={t.linkLabel}
    onfocus={(e) => e.currentTarget.select()}
  />
  <div class="actions">
    {#if canShare}
      <button type="button" class="primary" onclick={share}>{t.share}</button>
    {/if}
    <button type="button" class:primary={!canShare} onclick={copy}
      >{t.copyLink}</button
    >
  </div>
  {#if status}<p class="status" role="status">{t[status]}</p>{/if}
  {#if location.hostname === 'localhost'}
    <p class="warning">{t.localhost}</p>
  {/if}
</Dialog>

<style>
  p {
    margin: 0 0 0.75rem;
    font-size: 0.9rem;
  }

  input {
    width: 100%;
    padding: 0.45rem 0.5rem;
    font: 0.8rem var(--mono);
    border: 1px solid var(--border);
    border-radius: 0.4rem;
    background: var(--bg);
    color: var(--text);
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  button {
    flex: 1;
    padding: 0.6rem;
    font: inherit;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    background: var(--bg);
    color: var(--text);
    cursor: pointer;
  }

  .primary {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--on-accent);
    font-weight: 600;
  }

  .status {
    margin: 0.6rem 0 0;
    color: var(--muted);
  }

  .warning {
    margin: 0.6rem 0 0;
    font-size: 0.8rem;
    color: var(--muted);
  }
</style>
