<script lang="ts">
  import { clearNotes } from '../../core/editor';
  import { i18n } from '../../i18n/i18n.svelte';
  import { LOCALE_NAMES, LOCALES } from '../../i18n/locale';
  import type { Composition } from './composition.svelte';
  import Dialog from './Dialog.svelte';
  import HelpDialog from './HelpDialog.svelte';
  import Icon, { type IconName } from './Icon.svelte';
  import RtttlDialog from './RtttlDialog.svelte';

  interface Props {
    open: boolean;
    composition: Composition;
  }

  let { open = $bindable(), composition }: Props = $props();

  const t = $derived(i18n.t.menu);

  let rtttlOpen = $state(false);
  let helpOpen = $state(false);

  /** Closes the menu, then opens the chosen dialog over the page. */
  function show(openDialog: () => void) {
    open = false;
    openDialog();
  }

  function clearAll() {
    if (confirm(i18n.t.common.clearAllConfirm)) {
      composition.edit(clearNotes);
      open = false;
    }
  }
</script>

{#snippet item(
  icon: IconName,
  label: string,
  onclick: () => void,
  danger = false,
)}
  <button type="button" class="item" class:danger {onclick}>
    <Icon name={icon} size={20} />
    {label}
  </button>
{/snippet}

<Dialog bind:open title={t.title} placement="side">
  <nav>
    {@render item('text', t.rtttl, () => show(() => (rtttlOpen = true)))}
    {@render item('help', t.help, () => show(() => (helpOpen = true)))}
    {#if composition.melody.notes.length > 0}
      {@render item('trash', t.clearAll, clearAll, true)}
    {/if}
  </nav>

  <div class="language">
    <span><Icon name="language" size={20} />{t.language}</span>
    <div class="segmented" role="group" aria-label={t.language}>
      {#each LOCALES as locale (locale)}
        <button
          type="button"
          lang={locale}
          aria-pressed={i18n.locale === locale}
          title={LOCALE_NAMES[locale]}
          onclick={() => i18n.setLocale(locale)}>{locale.toUpperCase()}</button
        >
      {/each}
    </div>
  </div>
</Dialog>

<RtttlDialog bind:open={rtttlOpen} {composition} />
<HelpDialog bind:open={helpOpen} />

<style>
  nav {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.7rem 0.6rem;
    font: inherit;
    text-align: left;
    border: 0;
    border-radius: 0.5rem;
    background: transparent;
    color: var(--text);
    cursor: pointer;
  }

  .item :global(svg) {
    color: var(--accent);
  }

  .item:hover {
    background: var(--chip);
  }

  .item.danger,
  .item.danger :global(svg) {
    color: var(--danger);
  }

  .language {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-top: auto;
    padding: 0.9rem 0.6rem 0.3rem;
    border-top: 1px solid var(--border);
  }

  .language span {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .language :global(svg) {
    color: var(--accent);
  }

  .segmented {
    display: flex;
    padding: 0.2rem;
    border-radius: 0.5rem;
    background: var(--chip);
  }

  .segmented button {
    padding: 0.25rem 0.6rem;
    font: inherit;
    font-size: 0.85rem;
    border: 0;
    border-radius: 0.35rem;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
  }

  .segmented button[aria-pressed='true'] {
    background: var(--surface);
    color: var(--text);
    font-weight: 600;
  }
</style>
