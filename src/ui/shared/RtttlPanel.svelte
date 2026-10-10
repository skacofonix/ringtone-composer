<script lang="ts">
  import {
    parseRtttl,
    RtttlParseError,
    serializeRtttl,
  } from '../../core/rtttl';
  import type { Composition } from './composition.svelte';

  interface Props {
    composition: Composition;
  }

  let { composition }: Props = $props();

  /** Text being typed by the user; `null` shows the melody's RTTTL. */
  let draft = $state<string | null>(null);
  let error = $state<string | null>(null);
  let copyStatus = $state('');

  const text = $derived(draft ?? serializeRtttl(composition.melody));

  function oninput(event: Event & { currentTarget: HTMLTextAreaElement }) {
    draft = event.currentTarget.value;
    try {
      composition.load(parseRtttl(draft));
      error = null;
    } catch (e) {
      if (!(e instanceof RtttlParseError)) throw e;
      error = e.message;
    }
  }

  function onblur() {
    // Once valid, show the normalized RTTTL. Keep invalid text to fix it.
    if (error === null) draft = null;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      copyStatus = 'Copié !';
    } catch {
      // The clipboard API needs HTTPS (or localhost).
      copyStatus = 'Copie impossible : sélectionne le texte';
    }
    setTimeout(() => (copyStatus = ''), 2000);
  }
</script>

<details>
  <summary>Texte RTTTL (copier, coller, importer)</summary>
  <textarea
    aria-label="RTTTL"
    rows="4"
    spellcheck="false"
    value={text}
    {oninput}
    {onblur}
    aria-invalid={error !== null}></textarea>
  <div class="footer">
    {#if error}
      <span class="error" role="alert">{error}</span>
    {:else}
      <span class="hint">Colle un RTTTL ici pour l'importer.</span>
    {/if}
    <button type="button" onclick={copy}>{copyStatus || 'Copier'}</button>
  </div>
</details>

<style>
  details {
    border: 1px solid var(--border);
    border-radius: 0.6rem;
    background: var(--surface);
    padding: 0.6rem 0.75rem;
  }

  summary {
    cursor: pointer;
    font-weight: 600;
  }

  textarea {
    display: block;
    width: 100%;
    margin-top: 0.6rem;
    padding: 0.5rem;
    font: 0.85rem var(--mono);
    border: 1px solid var(--border);
    border-radius: 0.4rem;
    background: var(--bg);
    color: var(--text);
    resize: vertical;
  }

  textarea[aria-invalid='true'] {
    border-color: var(--danger);
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
