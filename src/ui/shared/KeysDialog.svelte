<script lang="ts">
  import {
    KeySequenceError,
    parseKeySequence,
    toKeySequence,
  } from '../../core/keypress';
  import { i18n } from '../../i18n/i18n.svelte';
  import type { Composition } from './composition.svelte';
  import Dialog from './Dialog.svelte';

  interface Props {
    open: boolean;
    composition: Composition;
  }

  let { open = $bindable(), composition }: Props = $props();

  const t = $derived(i18n.t.keys);

  /** Text being typed by the user; `null` shows the melody's keys. */
  let draft = $state<string | null>(null);
  let error = $state<KeySequenceError | null>(null);
  let copyStatus = $state<'copied' | 'copyFailed' | null>(null);

  const sequence = $derived(toKeySequence(composition.melody.notes));
  const text = $derived(draft ?? sequence.text);
  const errorMessage = $derived(
    error && t.error(t.errors[error.code](error.detail), error.position),
  );

  function oninput(event: Event & { currentTarget: HTMLTextAreaElement }) {
    draft = event.currentTarget.value;
    try {
      const notes = parseKeySequence(draft);
      // A sequence carries only notes: keep the current name and tempo.
      composition.load({ ...composition.melody, notes }, 'keys');
      error = null;
    } catch (e) {
      if (!(e instanceof KeySequenceError)) throw e;
      error = e;
    }
  }

  function onblur() {
    // Once valid, show the normalized sequence. Keep invalid text to fix it.
    if (error === null) draft = null;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      copyStatus = 'copied';
    } catch {
      copyStatus = 'copyFailed';
    }
    setTimeout(() => (copyStatus = null), 2000);
  }
</script>

<Dialog bind:open title={i18n.t.menu.keys}>
  <p>{t.intro}</p>
  <p class="legend">
    {#each t.legend.split('`') as part, i (i)}{#if i % 2}<kbd>{part}</kbd
        >{:else}{part}{/if}{/each}
  </p>
  <textarea
    aria-label={i18n.t.menu.keys}
    rows="5"
    spellcheck="false"
    value={text}
    {oninput}
    {onblur}
    aria-invalid={error !== null}></textarea>
  {#if sequence.approximated && draft === null}
    <p class="warning">{t.approximated}</p>
  {/if}
  <div class="footer">
    {#if error}
      <span class="error" role="alert">{errorMessage}</span>
    {:else}
      <span class="hint">{t.hint}</span>
    {/if}
    <button type="button" onclick={copy}
      >{copyStatus ? t[copyStatus] : t.copy}</button
    >
  </div>
</Dialog>

<style>
  p {
    margin: 0 0 0.6rem;
    font-size: 0.9rem;
  }

  .legend {
    color: var(--muted);
    font-size: 0.85rem;
  }

  kbd {
    padding: 0 0.3rem;
    border: 1px solid var(--border);
    border-radius: 0.25rem;
    font: 0.8rem var(--mono);
  }

  textarea {
    display: block;
    width: 100%;
    padding: 0.5rem;
    font: 1rem/1.6 var(--mono);
    letter-spacing: 0.05em;
    border: 1px solid var(--border);
    border-radius: 0.4rem;
    background: var(--bg);
    color: var(--text);
    resize: vertical;
  }

  textarea[aria-invalid='true'] {
    border-color: var(--danger);
  }

  .warning {
    margin: 0.4rem 0 0;
    color: var(--danger);
    font-size: 0.85rem;
  }

  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-top: 0.4rem;
    font-size: 0.85rem;
  }

  .hint {
    color: var(--muted);
  }

  .error {
    color: var(--danger);
  }

  button {
    flex-shrink: 0;
    padding: 0.35rem 0.8rem;
    font: inherit;
    border: 1px solid var(--border);
    border-radius: 0.4rem;
    background: var(--bg);
    color: var(--text);
    cursor: pointer;
  }
</style>
