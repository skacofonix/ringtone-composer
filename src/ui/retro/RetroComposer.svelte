<script lang="ts">
  import { noteBeforeCursor } from '../../core/editor';
  import { pressKey, type NokiaKey } from '../../core/nokia';
  import type { Composition } from '../shared/composition.svelte';
  import MelodySettings from '../shared/MelodySettings.svelte';
  import RtttlPanel from '../shared/RtttlPanel.svelte';
  import Lcd from './Lcd.svelte';
  import { pressable } from './press';
  import { renderComposer } from './screen';

  interface Props {
    composition: Composition;
  }

  let { composition }: Props = $props();

  const KEYPAD: { key: NokiaKey; hint: string; label: string }[] = [
    { key: '1', hint: 'C', label: 'Do' },
    { key: '2', hint: 'D', label: 'Ré' },
    { key: '3', hint: 'E', label: 'Mi' },
    { key: '4', hint: 'F', label: 'Fa' },
    { key: '5', hint: 'G', label: 'Sol' },
    { key: '6', hint: 'A', label: 'La' },
    { key: '7', hint: 'B', label: 'Si' },
    { key: '8', hint: 'court', label: 'Plus court' },
    { key: '9', hint: 'long', label: 'Plus long' },
    { key: '*', hint: 'oct.', label: 'Octave' },
    { key: '0', hint: 'pause', label: 'Silence' },
    { key: '#', hint: '♯', label: 'Dièse' },
  ];

  /** Keys that change the current note: play it so the change is heard. */
  const PREVIEW_KEYS = new Set<NokiaKey>([
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '*',
    '#',
  ]);

  const BLINK_MS = 500;

  let cursorVisible = $state(true);

  $effect(() => {
    const id = setInterval(() => (cursorVisible = !cursorVisible), BLINK_MS);
    return () => clearInterval(id);
  });

  const frame = $derived(
    renderComposer({
      melody: composition.melody,
      cursor: composition.editor.cursor,
      playingIndex: composition.playingIndex,
      playing: composition.playing,
      cursorVisible,
    }),
  );

  const screenLabel = $derived(
    `Écran : ${composition.melody.name}, ${composition.melody.notes.length} notes, tempo ${composition.melody.bpm}`,
  );

  function press(key: NokiaKey, long: boolean) {
    if (key === 'clear' && long && !confirm('Effacer toutes les notes ?')) {
      return;
    }
    composition.edit((s) => pressKey(s, key, long));
    cursorVisible = true;
    if (PREVIEW_KEYS.has(key)) {
      const note = noteBeforeCursor(composition.editor);
      if (note) composition.preview(note);
    }
  }

  // --- Computer keyboard: digits, * and #, Backspace, arrows, Enter. ---
  // Holding a key down acts as a long press, using the keyboard auto-repeat.

  const CODES: Record<string, NokiaKey> = {
    Backspace: 'clear',
    Delete: 'clear',
    ArrowLeft: 'left',
    ArrowUp: 'left',
    ArrowRight: 'right',
    ArrowDown: 'right',
    NumpadMultiply: '*',
  };

  function keyOf(event: KeyboardEvent): NokiaKey | 'play' | null {
    if (event.key === '*' || event.key === '#') return event.key;
    // `code` ignores the layout: digits work on AZERTY without Shift.
    const digit = /^(?:Digit|Numpad)(\d)$/.exec(event.code)?.[1];
    if (digit) return digit as NokiaKey;
    if (event.key === 'Enter') return 'play';
    return CODES[event.code] ?? null;
  }

  function isTyping(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement | null;
    return !!target?.closest('input, textarea, select, [contenteditable]');
  }

  let held: { key: NokiaKey; long: boolean } | null = null;

  function onkeydown(event: KeyboardEvent) {
    if (isTyping(event) || event.metaKey || (event.ctrlKey && !event.altKey)) {
      return;
    }
    const key = keyOf(event);
    if (!key) return;
    event.preventDefault();

    if (key === 'play') {
      if (!event.repeat) composition.togglePlay();
    } else if (key === 'left' || key === 'right') {
      press(key, false); // Navigation repeats while held.
    } else if (!event.repeat) {
      held = { key, long: false };
    } else if (held?.key === key && !held.long) {
      held.long = true;
      press(key, true);
    }
  }

  function onkeyup(event: KeyboardEvent) {
    const key = keyOf(event);
    if (held && held.key === key) {
      if (!held.long) press(held.key, false);
      held = null;
    }
  }
</script>

<svelte:window {onkeydown} {onkeyup} />

<div class="retro">
  <div class="phone">
    <div class="speaker" aria-hidden="true"></div>
    <div class="bezel">
      <Lcd {frame} label={screenLabel} />
    </div>

    <div class="navi-row">
      <div class="rocker" role="group" aria-label="Déplacer le curseur">
        <button
          type="button"
          aria-label="Note précédente"
          {@attach pressable(() => press('left', false))}>◀</button
        >
        <button
          type="button"
          aria-label="Note suivante"
          {@attach pressable(() => press('right', false))}>▶</button
        >
      </div>
      <button
        type="button"
        class="navi"
        aria-label={composition.playing ? 'Stop' : 'Jouer'}
        onclick={() => composition.togglePlay()}
      ></button>
      <button
        type="button"
        class="c-key"
        aria-label="Effacer (appui long : tout effacer)"
        {@attach pressable((long) => press('clear', long))}>C</button
      >
    </div>

    <div class="keypad">
      {#each KEYPAD as { key, hint, label } (key)}
        <button
          type="button"
          class="key"
          aria-label={`${key} : ${label}`}
          {@attach pressable((long) => press(key, long))}
        >
          <span class="digit">{key}</span>
          <span class="hint">{hint}</span>
        </button>
      {/each}
    </div>
  </div>

  <MelodySettings {composition} />

  <details class="help">
    <summary>Comment ça marche ?</summary>
    <ul>
      <li>
        <kbd>1</kbd> à <kbd>7</kbd> : notes do à si. <kbd>0</kbd> : silence.
      </li>
      <li>Appui long sur une note : note pointée (durée × 1,5).</li>
      <li>
        <kbd>8</kbd> / <kbd>9</kbd> : note courante plus courte / plus longue.
      </li>
      <li><kbd>*</kbd> : octave suivante, <kbd>#</kbd> : dièse.</li>
      <li>
        <kbd>C</kbd> : effacer la note, appui long : tout effacer. ◀ ▶ : déplacer
        le curseur.
      </li>
      <li>Grande touche centrale : jouer / arrêter.</li>
      <li>
        Au clavier d'ordinateur : chiffres, <kbd>*</kbd>, <kbd>#</kbd>,
        <kbd>Retour arrière</kbd>, flèches et <kbd>Entrée</kbd>. Garder une
        touche enfoncée = appui long.
      </li>
    </ul>
  </details>

  <RtttlPanel {composition} />
</div>

<style>
  .retro {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  /* --- Phone body, inspired by the 3310 --- */

  .phone {
    --key: #d5dde8;
    --key-ink: #24324f;
    --key-pressed: #b3c0d3;

    width: min(100%, 19rem);
    margin: 0 auto;
    padding: 1rem 1.1rem 1.5rem;
    border-radius: 2.6rem 2.6rem 3.4rem 3.4rem;
    background:
      radial-gradient(
        120% 60% at 50% 0%,
        rgb(255 255 255 / 0.12),
        transparent 60%
      ),
      var(--phone-body);
    box-shadow:
      inset 0 0 0 2px rgb(255 255 255 / 0.06),
      0 0.6rem 1.6rem rgb(0 0 0 / 0.35);
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }

  .speaker {
    width: 2.6rem;
    height: 0.3rem;
    margin: 0 auto 0.8rem;
    border-radius: 1rem;
    background: rgb(0 0 0 / 0.45);
  }

  .bezel {
    padding: 0.9rem 0.9rem 1.1rem;
    border-radius: 0.9rem 0.9rem 2.2rem 2.2rem;
    background: #3b4250;
    box-shadow: inset 0 0.15rem 0.4rem rgb(0 0 0 / 0.5);
  }

  button {
    font: inherit;
    border: 0;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  .navi-row {
    display: grid;
    grid-template-columns: 1fr 1.4fr 1fr;
    align-items: center;
    gap: 0.6rem;
    margin: 1rem 0 1.1rem;
  }

  .rocker {
    display: flex;
    overflow: hidden;
    border-radius: 1rem;
    background: var(--key);
  }

  .rocker button {
    flex: 1;
    padding: 0.55rem 0;
    background: none;
    color: var(--key-ink);
    font-size: 0.75rem;
  }

  .rocker button:active {
    background: var(--key-pressed);
  }

  .navi {
    height: 2.6rem;
    border-radius: 50% 50% 45% 45% / 60% 60% 40% 40%;
    background: linear-gradient(#a9bde0, #7f98c4);
    box-shadow:
      inset 0 -0.2rem 0 rgb(0 0 0 / 0.2),
      0 0.15rem 0.3rem rgb(0 0 0 / 0.4);
  }

  .navi:active {
    background: #7f98c4;
    box-shadow: inset 0 0.1rem 0.2rem rgb(0 0 0 / 0.3);
  }

  .c-key {
    justify-self: end;
    width: 2.8rem;
    padding: 0.45rem 0;
    border-radius: 1rem;
    background: var(--key);
    color: var(--key-ink);
    font-weight: 700;
  }

  .c-key:active {
    background: var(--key-pressed);
  }

  .keypad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.55rem 0.8rem;
  }

  .key {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.3rem;
    padding: 0.5rem 0;
    border-radius: 45% 45% 50% 50% / 60% 60% 70% 70%;
    background: var(--key);
    color: var(--key-ink);
    box-shadow:
      inset 0 -0.2rem 0 rgb(0 0 0 / 0.12),
      0 0.12rem 0.25rem rgb(0 0 0 / 0.35);
  }

  .key:active {
    background: var(--key-pressed);
    box-shadow: inset 0 0.1rem 0.2rem rgb(0 0 0 / 0.25);
  }

  .digit {
    font-size: 1.15rem;
    font-weight: 700;
  }

  .hint {
    font-size: 0.65rem;
    opacity: 0.75;
  }

  /* --- Help --- */

  .help {
    border: 1px solid var(--border);
    border-radius: 0.6rem;
    background: var(--surface);
    padding: 0.6rem 0.75rem;
    font-size: 0.9rem;
  }

  .help summary {
    cursor: pointer;
    font-weight: 600;
  }

  .help ul {
    margin: 0.5rem 0 0;
    padding-left: 1.1rem;
  }

  kbd {
    padding: 0 0.3rem;
    border: 1px solid var(--border);
    border-radius: 0.25rem;
    font: 0.8rem var(--mono);
  }
</style>
