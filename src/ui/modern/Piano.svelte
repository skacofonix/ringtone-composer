<script lang="ts">
  import { PITCH_CLASSES, type PitchClass } from '../../core/melody';
  import { i18n } from '../../i18n/i18n.svelte';

  interface Props {
    /** Octave of the leftmost C. */
    baseOctave: number;
    octaves?: number;
    onpress: (pitch: PitchClass, octave: number) => void;
  }

  let { baseOctave, octaves = 2, onpress }: Props = $props();

  interface Key {
    pitch: PitchClass;
    octave: number;
    /** Black keys only: number of white keys on their left. */
    whitesBefore: number;
  }

  const keys = $derived.by(() => {
    const whites: Key[] = [];
    const blacks: Key[] = [];
    for (let i = 0; i < octaves; i++) {
      const octave = baseOctave + i;
      for (const pitch of PITCH_CLASSES) {
        const key = { pitch, octave, whitesBefore: whites.length };
        (pitch.endsWith('#') ? blacks : whites).push(key);
      }
    }
    return { whites, blacks };
  });

  const whiteWidth = $derived(100 / keys.whites.length);
</script>

<div class="piano" role="group" aria-label={i18n.t.modern.piano}>
  {#each keys.whites as key (`${key.pitch}${key.octave}`)}
    <button
      type="button"
      class="white"
      aria-label={`${key.pitch}${key.octave}`}
      onclick={() => onpress(key.pitch, key.octave)}
    >
      <span class="label">
        {key.pitch.toUpperCase()}{#if key.pitch === 'c'}<sub>{key.octave}</sub
          >{/if}
      </span>
    </button>
  {/each}

  {#each keys.blacks as key (`${key.pitch}${key.octave}`)}
    <button
      type="button"
      class="black"
      aria-label={`${key.pitch}${key.octave}`}
      style:left="{key.whitesBefore * whiteWidth}%"
      style:width="{whiteWidth * 0.6}%"
      onclick={() => onpress(key.pitch, key.octave)}
    ></button>
  {/each}
</div>

<style>
  .piano {
    position: relative;
    display: flex;
    height: 10rem;
    user-select: none;
    -webkit-user-select: none;
  }

  button {
    padding: 0;
    border: 0;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  .white {
    flex: 1;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 0.4rem;
    margin-right: 1px;
    border-radius: 0 0 0.35rem 0.35rem;
    background: #fdfdfd;
    box-shadow: inset 0 -0.4rem 0 #e2e4e8;
    color: #6b7280;
    font-size: 0.7rem;
  }

  .white:active {
    background: #e8ecf3;
    box-shadow: inset 0 -0.15rem 0 #d0d4da;
  }

  .black {
    position: absolute;
    top: 0;
    height: 60%;
    transform: translateX(-50%);
    border-radius: 0 0 0.3rem 0.3rem;
    background: #1b1d22;
    box-shadow: inset 0 -0.3rem 0 #3a3e47;
  }

  .black:active {
    background: #3a3e47;
    box-shadow: none;
  }

  .label sub {
    font-size: 0.75em;
  }
</style>
