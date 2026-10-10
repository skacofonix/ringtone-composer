<script lang="ts">
  import { MelodyPlayer } from './audio/player';
  import { melodyDurationMs, type Note } from './core/melody';
  import { parseRtttl, RtttlParseError } from './core/rtttl';

  const player = new MelodyPlayer();

  let text = $state(
    'NokiaTune:d=4,o=5,b=225:8e6,8d6,f#,g#,8c#6,8b,d,e,8b,8a,c#,e,2a',
  );
  let playing = $state(false);
  let currentNote = $state(-1);

  const result = $derived.by(() => {
    try {
      return { melody: parseRtttl(text), error: null };
    } catch (e) {
      if (e instanceof RtttlParseError) return { melody: null, error: e };
      throw e;
    }
  });

  function togglePlay() {
    if (playing) {
      player.stop();
      return;
    }
    if (!result.melody) return;
    playing = true;
    void player.play(result.melody, {
      onNote: (index) => (currentNote = index),
      onEnd: () => (playing = false),
    });
  }

  function label(note: Note): string {
    const dot = note.dotted ? '.' : '';
    return note.kind === 'tone'
      ? `${note.duration}${note.pitch}${note.octave}${dot}`
      : `${note.duration}-${dot}`;
  }
</script>

<main>
  <h1>RingtoneComposer</h1>
  <p class="muted">En construction : colle un RTTTL et écoute-le.</p>

  <label for="rtttl">RTTTL</label>
  <textarea id="rtttl" bind:value={text} rows="4" spellcheck="false"></textarea>

  <output class="lcd" for="rtttl">
    {#if result.melody}
      <span>
        {result.melody.name || 'Sans titre'} · {result.melody.notes.length} notes
        · {(melodyDurationMs(result.melody) / 1000).toFixed(1)} s
      </span>
      <span class="notes">
        {#each result.melody.notes as note, i (i)}
          <span class="note" class:current={i === currentNote}
            >{label(note)}</span
          >
        {/each}
      </span>
    {:else}
      {result.error?.message}
    {/if}
  </output>

  <button
    type="button"
    onclick={togglePlay}
    disabled={!result.melody || result.melody.notes.length === 0}
  >
    {playing ? '■ Stop' : '▶ Jouer'}
  </button>
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
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-family: var(--mono);
    padding: 0.75rem;
    border-radius: 0.5rem;
    background: var(--lcd-bg);
    color: var(--lcd-ink);
  }

  .notes {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.6rem;
  }

  .note.current {
    background: var(--lcd-ink);
    color: var(--lcd-bg);
  }

  button {
    font: inherit;
    font-weight: 600;
    padding: 0.75rem;
    border: 0;
    border-radius: 0.5rem;
    background: var(--phone-body);
    color: white;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
