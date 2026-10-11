<script lang="ts">
  import type { Snippet } from 'svelte';
  import { i18n } from '../../i18n/i18n.svelte';

  interface Props {
    open: boolean;
    title: string;
    /** `bottom`: sheet sliding from the bottom; `side`: drawer on the right. */
    placement?: 'center' | 'bottom' | 'side';
    children: Snippet;
  }

  let {
    open = $bindable(),
    title,
    placement = 'center',
    children,
  }: Props = $props();

  let dialog = $state<HTMLDialogElement>();
  const titleId = $props.id();

  // Native <dialog>: focus trap, Escape and backdrop come for free.
  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  });
</script>

<!-- Clicking the backdrop (the dialog element itself) closes it; Escape is native. -->
<dialog
  class={placement}
  bind:this={dialog}
  aria-labelledby={titleId}
  onclose={() => (open = false)}
  onclick={(e) => {
    if (e.target === dialog) open = false;
  }}
>
  <div class="panel">
    <header>
      <h2 id={titleId}>{title}</h2>
      <button
        type="button"
        aria-label={i18n.t.common.close}
        onclick={() => (open = false)}>✕</button
      >
    </header>
    {@render children()}
  </div>
</dialog>

<style>
  dialog {
    width: min(100% - 2rem, 30rem);
    max-height: min(100% - 2rem, 40rem);
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 0.8rem;
    background: var(--surface);
    color: var(--text);
    box-shadow: 0 1rem 3rem rgb(0 0 0 / 0.4);
  }

  dialog.bottom {
    width: 100%;
    max-width: 40rem;
    margin: auto auto 0;
    border-width: 1px 0 0;
    border-radius: 1.1rem 1.1rem 0 0;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  dialog.side {
    width: min(82%, 20rem);
    height: 100%;
    max-height: 100%;
    margin: 0 0 0 auto;
    border-width: 0 0 0 1px;
    border-radius: 0;
    padding-top: env(safe-area-inset-top, 0px);
  }

  dialog.side .panel {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }

  @media (prefers-reduced-motion: no-preference) {
    dialog.bottom[open] {
      animation: slide-up 0.2s ease-out;
    }

    dialog.side[open] {
      animation: slide-in 0.2s ease-out;
    }
  }

  @keyframes slide-up {
    from {
      transform: translateY(100%);
    }
  }

  @keyframes slide-in {
    from {
      transform: translateX(100%);
    }
  }

  dialog::backdrop {
    background: rgb(0 0 0 / 0.5);
  }

  .panel {
    padding: 0.9rem 1rem 1.1rem;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  h2 {
    margin: 0;
    font-size: 1.15rem;
  }

  header button {
    padding: 0.25rem 0.5rem;
    font: inherit;
    border: 0;
    border-radius: 0.4rem;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
  }
</style>
