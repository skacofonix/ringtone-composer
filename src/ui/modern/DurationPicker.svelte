<script lang="ts">
  import { DURATIONS, type Duration } from '../../core/melody';
  import { i18n } from '../../i18n/i18n.svelte';

  interface Props {
    duration: Duration;
    dotted: boolean;
  }

  let { duration = $bindable(), dotted = $bindable() }: Props = $props();

  const t = $derived(i18n.t.modern);
</script>

<div class="picker" role="group" aria-label={t.nextDuration}>
  {#each DURATIONS as value (value)}
    <button
      type="button"
      title={t.durations[value]}
      aria-label={t.durations[value]}
      aria-pressed={duration === value}
      onclick={() => (duration = value)}
    >
      {value === 1 ? '1' : `1/${value}`}
    </button>
  {/each}
  <button
    type="button"
    class="dot"
    title={t.dottedTitle}
    aria-label={t.dotted}
    aria-pressed={dotted}
    onclick={() => (dotted = !dotted)}
  >
    •
  </button>
</div>

<style>
  .picker {
    display: flex;
    gap: 0.25rem;
  }

  button {
    flex: 1;
    min-width: 0;
    padding: 0.45rem 0;
    font: inherit;
    font-size: 0.85rem;
    border: 1px solid var(--border);
    border-radius: 0.4rem;
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
    touch-action: manipulation;
  }

  button[aria-pressed='true'] {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--on-accent);
  }

  .dot {
    flex: 0.7;
    font-weight: 700;
  }
</style>
