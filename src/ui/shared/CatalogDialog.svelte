<script lang="ts">
  import { CLASSICS, type CatalogEntry } from '../../catalog/classics';
  import { parseRtttl } from '../../core/rtttl';
  import type { Composition } from './composition.svelte';
  import Dialog from './Dialog.svelte';

  interface Props {
    open: boolean;
    composition: Composition;
  }

  let { open = $bindable(), composition }: Props = $props();

  /** Entry being auditioned, if any. */
  let playingId = $state<string | null>(null);

  // Closing the dialog stops the audition.
  $effect(() => {
    if (!open && playingId !== null) composition.stop();
  });

  function toggleAudition(entry: CatalogEntry) {
    if (playingId === entry.id) {
      composition.stop();
      return;
    }
    playingId = entry.id;
    composition.audition(parseRtttl(entry.rtttl), () => {
      if (playingId === entry.id) playingId = null;
    });
  }

  function load(entry: CatalogEntry) {
    const current = composition.melody;
    if (
      current.notes.length > 0 &&
      !confirm(`Remplacer « ${current.name} » par « ${entry.title} » ?`)
    ) {
      return;
    }
    composition.load(parseRtttl(entry.rtttl));
    open = false;
  }
</script>

<Dialog bind:open title="Classiques">
  <ul>
    {#each CLASSICS as entry (entry.id)}
      <li>
        <button
          type="button"
          class="listen"
          aria-label={playingId === entry.id
            ? `Arrêter ${entry.title}`
            : `Écouter ${entry.title}`}
          onclick={() => toggleAudition(entry)}
          >{playingId === entry.id ? '■' : '▶'}</button
        >
        <button type="button" class="entry" onclick={() => load(entry)}>
          <span class="title">{entry.title}</span>
          <span class="origin">{entry.origin}</span>
        </button>
      </li>
    {/each}
  </ul>
  <p class="note">
    Uniquement des œuvres du domaine public. Toucher un titre le charge dans le
    compositeur.
  </p>
</Dialog>

<style>
  ul {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
    gap: 0.4rem;
  }

  button {
    font: inherit;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    background: var(--bg);
    color: var(--text);
    cursor: pointer;
  }

  .listen {
    flex-shrink: 0;
    width: 2.6rem;
    color: var(--accent);
  }

  .entry {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0.4rem 0.6rem;
    text-align: left;
  }

  .title {
    font-weight: 600;
  }

  .origin {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .note {
    margin: 0.75rem 0 0;
    font-size: 0.8rem;
    color: var(--muted);
  }
</style>
