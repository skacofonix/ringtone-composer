<script lang="ts">
  import type { Note } from '../../core/melody';
  import { i18n } from '../../i18n/i18n.svelte';
  import { noteLength, noteName } from './format';

  interface Props {
    notes: readonly Note[];
    /** Insertion point, between notes. */
    cursor: number;
    playingIndex: number;
    /**
     * Called with the new cursor position when a note is tapped: after the
     * note, or before it if the cursor was already after it.
     */
    onselect: (cursor: number) => void;
  }

  let { notes, cursor, playingIndex, onselect }: Props = $props();

  let caret = $state<HTMLElement>();

  // Keep the insertion point visible when notes are added or the cursor moves.
  $effect(() => {
    void cursor;
    caret?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
</script>

<div class="score" aria-label={i18n.t.modern.score}>
  {#if cursor === 0}<span class="caret" bind:this={caret}></span>{/if}

  {#each notes as note, i (i)}
    <button
      type="button"
      class="note"
      class:rest={note.kind === 'rest'}
      class:current={i === cursor - 1}
      class:playing={i === playingIndex}
      onclick={() => onselect(cursor === i + 1 ? i : i + 1)}
    >
      <span class="name">{noteName(note)}</span>
      <span class="length">{noteLength(note)}</span>
    </button>
    {#if cursor === i + 1}<span class="caret" bind:this={caret}></span>{/if}
  {:else}
    <span class="empty">{i18n.t.modern.emptyScore}</span>
  {/each}
</div>

<style>
  .score {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.3rem;
    min-height: 3.5rem;
    max-height: 9.5rem;
    overflow-y: auto;
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 0.6rem;
    background: var(--surface);
  }

  button {
    font: inherit;
    border: 0;
    cursor: pointer;
    touch-action: manipulation;
  }

  .note {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 2.6rem;
    padding: 0.2rem 0.35rem;
    border-radius: 0.4rem;
    background: var(--chip);
    color: var(--text);
    line-height: 1.2;
  }

  .note.rest {
    color: var(--muted);
  }

  /* The note edited by the bar below the score. */
  .note.current {
    box-shadow: inset 0 0 0 2px var(--accent);
  }

  .note.playing {
    background: var(--accent);
    color: var(--on-accent);
  }

  .name {
    font-weight: 600;
  }

  .length {
    font-size: 0.7rem;
    opacity: 0.75;
  }

  .caret {
    align-self: stretch;
    width: 2px;
    border-radius: 1px;
    background: var(--accent);
    animation: blink 1s steps(1) infinite;
  }

  .empty {
    color: var(--muted);
    font-size: 0.9rem;
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }
</style>
