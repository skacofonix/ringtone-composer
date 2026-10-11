<script lang="ts">
  import { clearNotes } from '../../core/editor';
  import { i18n } from '../../i18n/i18n.svelte';
  import { LOCALE_NAMES, LOCALES } from '../../i18n/locale';
  import type { Composition } from './composition.svelte';
  import Dialog from './Dialog.svelte';
  import HelpDialog from './HelpDialog.svelte';
  import KeysDialog from './KeysDialog.svelte';
  import Icon, { type IconName } from './Icon.svelte';
  import RtttlDialog from './RtttlDialog.svelte';
  import { theme, THEMES } from './theme.svelte';

  interface Props {
    open: boolean;
    composition: Composition;
  }

  let { open = $bindable(), composition }: Props = $props();

  const t = $derived(i18n.t.menu);

  let rtttlOpen = $state(false);
  let helpOpen = $state(false);
  let keysOpen = $state(false);

  /** Closes the menu, then opens the chosen dialog over the page. */
  function show(openDialog: () => void) {
    open = false;
    openDialog();
  }

  function clearAll() {
    // No confirmation: it can be undone.
    composition.edit(clearNotes);
    open = false;
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

<Dialog bind:open title="RingtoneComposer" placement="side">
  <nav>
    {@render item('text', t.rtttl, () => show(() => (rtttlOpen = true)))}
    {@render item('keypad', t.keys, () => show(() => (keysOpen = true)))}
    {@render item('help', t.help, () => show(() => (helpOpen = true)))}
    {#if composition.melody.notes.length > 0}
      {@render item('trash', t.clearAll, clearAll, true)}
    {/if}
  </nav>

  <div class="settings">
    <div class="setting">
      <span><Icon name="theme" size={20} />{t.theme}</span>
      <div class="segmented" role="group" aria-label={t.theme}>
        {#each THEMES as value (value)}
          <button
            type="button"
            aria-pressed={theme.current === value}
            onclick={() => theme.set(value)}>{i18n.t.themes[value]}</button
          >
        {/each}
      </div>
    </div>

    <div class="setting">
      <span><Icon name="language" size={20} />{t.language}</span>
      <div class="segmented" role="group" aria-label={t.language}>
        {#each LOCALES as locale (locale)}
          <button
            type="button"
            lang={locale}
            aria-pressed={i18n.locale === locale}
            title={LOCALE_NAMES[locale]}
            onclick={() => i18n.setLocale(locale)}
            >{locale.toUpperCase()}</button
          >
        {/each}
      </div>
    </div>
  </div>

  <p class="about">
    {t.version(__APP_VERSION__)} ·
    <a
      href="https://github.com/skacofonix/ringtone-composer/releases"
      target="_blank"
      rel="noopener">{t.releases}</a
    >
  </p>
</Dialog>

<RtttlDialog bind:open={rtttlOpen} {composition} />
<HelpDialog bind:open={helpOpen} />
<KeysDialog bind:open={keysOpen} {composition} />

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

  .settings {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin-top: auto;
    padding: 0.9rem 0.6rem 0.3rem;
    border-top: 1px solid var(--border);
  }

  .setting {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .setting span {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .setting :global(svg) {
    color: var(--accent);
  }

  .about {
    margin: 0.75rem 0 0;
    padding: 0 0.6rem;
    color: var(--muted);
    font-size: 0.8rem;
  }

  .about a {
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
