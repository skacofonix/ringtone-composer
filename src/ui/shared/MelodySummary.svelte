<script lang="ts">
  import { i18n } from '../../i18n/i18n.svelte';
  import type { Composition } from './composition.svelte';
  import Dialog from './Dialog.svelte';
  import Icon from './Icon.svelte';
  import MelodySettings from './MelodySettings.svelte';

  interface Props {
    composition: Composition;
  }

  let { composition }: Props = $props();

  let open = $state(false);
</script>

<button
  type="button"
  class="summary"
  aria-label={i18n.t.summary.edit}
  onclick={() => {
    composition.stop();
    open = true;
  }}
>
  <Icon name="music" size={18} />
  <span class="text">
    <strong>{composition.melody.name || i18n.t.common.untitled}</strong>
    <span class="sep" aria-hidden="true">·</span>
    {composition.melody.bpm}
    <span class="sep" aria-hidden="true">·</span>
    {i18n.t.instruments[composition.instrument]}
  </span>
  <span class="edit"><Icon name="pencil" size={18} /></span>
</button>

<Dialog bind:open title={i18n.t.summary.title} placement="bottom">
  <MelodySettings {composition} />
  <button type="button" class="done" onclick={() => (open = false)}
    >{i18n.t.summary.done}</button
  >
</Dialog>

<style>
  .summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.6rem 0.75rem;
    font: inherit;
    text-align: left;
    border: 1px solid var(--border);
    border-radius: 0.7rem;
    background: var(--surface);
    color: var(--muted);
    cursor: pointer;
  }

  .summary > :global(svg),
  .edit {
    color: var(--accent);
  }

  .text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  strong {
    color: var(--text);
  }

  .sep {
    margin: 0 0.2rem;
    opacity: 0.6;
  }

  .done {
    width: 100%;
    margin-top: 1rem;
    padding: 0.7rem;
    font: inherit;
    font-weight: 600;
    border: 0;
    border-radius: 0.6rem;
    background: var(--accent);
    color: var(--on-accent);
    cursor: pointer;
  }
</style>
