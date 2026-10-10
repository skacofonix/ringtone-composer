<script lang="ts">
  import { melodyDurationMs } from './core/melody';
  import { parseRtttl, RtttlParseError } from './core/rtttl';

  let text = $state(
    'NokiaTune:d=4,o=5,b=225:8e6,8d6,f#,g#,8c#6,8b,d,e,8b,8a,c#,e,2a',
  );

  const result = $derived.by(() => {
    try {
      return { melody: parseRtttl(text), error: null };
    } catch (e) {
      if (e instanceof RtttlParseError) return { melody: null, error: e };
      throw e;
    }
  });
</script>

<main>
  <h1>RingtoneComposer</h1>
  <p class="muted">En construction : colle un RTTTL pour le vérifier.</p>

  <label for="rtttl">RTTTL</label>
  <textarea id="rtttl" bind:value={text} rows="4" spellcheck="false"></textarea>

  <output class="lcd" for="rtttl">
    {#if result.melody}
      {result.melody.name || 'Sans titre'} · {result.melody.notes.length} notes ·
      {(melodyDurationMs(result.melody) / 1000).toFixed(1)} s
    {:else}
      {result.error?.message}
    {/if}
  </output>
</main>

<style>
  main {
    max-width: 40rem;
    margin: 0 auto;
    padding: 1.5rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  h1 {
    margin: 0;
  }

  .muted {
    margin: 0;
    color: var(--muted);
  }

  textarea {
    font: 0.9rem var(--mono);
    padding: 0.5rem;
    width: 100%;
  }

  .lcd {
    font-family: var(--mono);
    padding: 0.75rem;
    border-radius: 0.5rem;
    background: var(--lcd-bg);
    color: var(--lcd-ink);
  }
</style>
