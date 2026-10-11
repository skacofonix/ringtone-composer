<script lang="ts">
  import { INSTRUMENT_IDS } from '../../audio/instruments';
  import { CLASSICS } from '../../catalog/classics';
  import { clearNotes, noteBeforeCursor, setBpm } from '../../core/editor';
  import { tone } from '../../core/melody';
  import { pressKey, type NokiaKey } from '../../core/nokia';
  import { parseRtttl } from '../../core/rtttl';
  import { i18n } from '../../i18n/i18n.svelte';
  import type { Composition } from '../shared/composition.svelte';
  import { dialogs } from '../shared/dialogs.svelte';
  import Lcd from './Lcd.svelte';
  import {
    menuPress,
    openMenu,
    type MenuAction,
    type MenuKey,
    type MenuState,
  } from './menu';
  import { pressable } from './press';
  import { renderComposer, renderList, renderValue } from './screen';

  interface Props {
    composition: Composition;
  }

  let { composition }: Props = $props();

  /** Keypad layout, row by row; texts come from the dictionary. */
  const KEYPAD = [
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
    '0',
    '#',
  ] as const;

  /** Note letters printed on the keys; the other keys are explained in Help. */
  const NOTE_LETTERS: Partial<Record<NokiaKey, string>> = {
    '1': 'C',
    '2': 'D',
    '3': 'E',
    '4': 'F',
    '5': 'G',
    '6': 'A',
    '7': 'B',
  };

  const t = $derived(i18n.t.retro);

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

  /** Played to try an instrument while scrolling through the list. */
  const DEMO_NOTE = tone('c', 5, 4);

  const BLINK_MS = 500;

  let cursorVisible = $state(true);

  /** The Options menu on the LCD; `null` shows the composer screen. */
  let menu = $state<MenuState | null>(null);

  $effect(() => {
    const id = setInterval(() => (cursorVisible = !cursorVisible), BLINK_MS);
    return () => clearInterval(id);
  });

  const menuContext = $derived({
    bpm: composition.melody.bpm,
    instrument: composition.instrument,
    hasNotes: composition.melody.notes.length > 0,
  });

  /** Texts of the current menu screen, for the LCD and screen readers. */
  const menuView = $derived.by(() => {
    if (!menu) return null;
    const m = t.menu;
    switch (menu.screen) {
      case 'options':
        return {
          kind: 'list' as const,
          title: m.options,
          items: menu.items.map((id) => m.items[id]),
          index: menu.index,
        };
      case 'instrument':
        return {
          kind: 'list' as const,
          title: m.items.instrument,
          items: INSTRUMENT_IDS.map((id) => i18n.t.instruments[id]),
          index: menu.index,
        };
      case 'classics':
        return {
          kind: 'list' as const,
          title: m.items.classics,
          items: CLASSICS.map((entry) => i18n.pick(entry.title)),
          index: menu.index,
        };
      case 'tempo':
        return { kind: 'tempo' as const, title: m.items.tempo, bpm: menu.bpm };
    }
  });

  const frame = $derived.by(() => {
    if (menuView?.kind === 'tempo') {
      return renderValue({
        title: menuView.title,
        value: String(menuView.bpm),
        caption: t.menu.bpm,
        softKey: t.menu.ok,
      });
    }
    if (menuView) return renderList({ ...menuView, softKey: t.menu.choose });
    return renderComposer({
      melody: composition.melody,
      cursor: composition.editor.cursor,
      playingIndex: composition.playingIndex,
      playing: composition.playing,
      cursorVisible,
      labels: {
        options: t.menu.options,
        stop: i18n.t.common.stop,
        untitled: i18n.t.common.untitled,
      },
    });
  });

  const screenLabel = $derived.by(() => {
    if (menuView?.kind === 'tempo') return t.menu.tempoScreen(menuView.bpm);
    if (menuView) {
      return t.menu.screen(
        menuView.title,
        menuView.items[menuView.index] ?? '',
        menuView.index + 1,
        menuView.items.length,
      );
    }
    return t.screen(
      composition.melody.name,
      composition.melody.notes.length,
      composition.melody.bpm,
    );
  });

  function press(key: NokiaKey, long: boolean) {
    if (menu) return pressInMenu(key);
    // Long press on C clears everything: no confirmation, it can be undone.
    composition.edit((s) => pressKey(s, key, long));
    cursorVisible = true;
    if (PREVIEW_KEYS.has(key)) {
      const note = noteBeforeCursor(composition.editor);
      if (note) composition.preview(note);
    }
  }

  /** In the menu: scroll key moves, C goes back, digits jump to an item. */
  function pressInMenu(key: NokiaKey) {
    if (key === 'left') menuKey('up');
    else if (key === 'right') menuKey('down');
    else if (key === 'clear') menuKey('back');
    else if (/^[1-9]$/.test(key)) menuKey(Number(key));
  }

  /** Navi key: opens Options (long press: play / stop); selects in the menu. */
  function navi(long: boolean) {
    if (composition.playing) {
      composition.stop();
    } else if (menu) {
      menuKey('select');
    } else if (long) {
      composition.togglePlay();
    } else {
      menu = openMenu(menuContext);
    }
  }

  function menuKey(key: MenuKey) {
    if (!menu) return;
    const result = menuPress(menu, key, menuContext);
    menu = result.state;
    if (result.action) run(result.action);
  }

  function run(action: MenuAction) {
    switch (action.type) {
      case 'play':
        composition.togglePlay();
        break;
      case 'setBpm':
        composition.edit((s) => setBpm(s, action.bpm));
        break;
      case 'setInstrument':
        composition.setInstrument(action.instrument);
        composition.preview(DEMO_NOTE);
        break;
      case 'previewInstrument':
        composition.preview(DEMO_NOTE, action.instrument);
        break;
      case 'loadClassic': {
        const entry = CLASSICS.find((c) => c.id === action.id);
        if (entry) composition.load(parseRtttl(entry.rtttl));
        break;
      }
      case 'share':
        dialogs.share = true;
        break;
      case 'ringtone':
        dialogs.export = true;
        break;
      case 'clearAll':
        composition.edit(clearNotes);
        break;
    }
  }

  // --- Computer keyboard: digits, * and #, Backspace, arrows, Enter (Navi),
  // Space (play), Escape (back). Holding a key down acts as a long press,
  // using the keyboard auto-repeat.

  type Key = NokiaKey | 'navi';

  const CODES: Record<string, Key> = {
    Backspace: 'clear',
    Delete: 'clear',
    Escape: 'clear',
    ArrowLeft: 'left',
    ArrowUp: 'left',
    ArrowRight: 'right',
    ArrowDown: 'right',
    NumpadMultiply: '*',
    Enter: 'navi',
    NumpadEnter: 'navi',
  };

  function keyOf(event: KeyboardEvent): Key | 'play' | null {
    if (event.key === '*' || event.key === '#') return event.key;
    if (event.key === ' ') return 'play';
    // `code` ignores the layout: digits work on AZERTY without Shift.
    const digit = /^(?:Digit|Numpad)(\d)$/.exec(event.code)?.[1];
    if (digit) return digit as NokiaKey;
    return CODES[event.code] ?? null;
  }

  /** Keys that belong to the focused element rather than to the phone. */
  function belongsToFocus(event: KeyboardEvent, key: Key | 'play'): boolean {
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable]')) {
      return true;
    }
    // Enter and Space activate a focused button (keyboard navigation).
    return (key === 'navi' || key === 'play') && !!target?.closest('button');
  }

  function pressAny(key: Key, long: boolean) {
    if (key === 'navi') navi(long);
    else press(key, long);
  }

  let held: { key: Key; long: boolean } | null = null;

  function onkeydown(event: KeyboardEvent) {
    // Keys typed while a dialog is open belong to the dialog.
    if (document.querySelector('dialog[open]')) return;
    if (event.metaKey || (event.ctrlKey && !event.altKey)) return;
    const key = keyOf(event);
    if (!key || belongsToFocus(event, key)) return;
    event.preventDefault();

    if (key === 'play') {
      if (!event.repeat) composition.togglePlay();
    } else if (key === 'left' || key === 'right') {
      press(key, false); // Navigation repeats while held.
    } else if (!event.repeat) {
      held = { key, long: false };
    } else if (held?.key === key && !held.long) {
      held.long = true;
      pressAny(key, true);
    }
  }

  function onkeyup(event: KeyboardEvent) {
    const key = keyOf(event);
    if (held && held.key === key) {
      if (!held.long) pressAny(held.key, false);
      held = null;
    }
  }
</script>

<svelte:window {onkeydown} {onkeyup} />

<div class="retro">
  <div class="phone">
    <div class="body">
      <div class="speaker" aria-hidden="true">
        {#each [1, 2, 3, 4, 5] as slot (slot)}<span></span>{/each}
      </div>

      <div class="frame">
        <div class="face">
          <Lcd {frame} label={screenLabel} />
        </div>

        <!-- Same order as the real 3310: C, Navi key, scroll key. -->
        <div class="controls">
          <button
            type="button"
            class="c-key"
            aria-label={t.clearKey}
            {@attach pressable((long) => press('clear', long))}>C</button
          >
          <button
            type="button"
            class="navi"
            aria-label={composition.playing
              ? i18n.t.common.stop
              : menu
                ? t.menu.choose
                : t.naviKey}
            {@attach pressable((long) => navi(long))}
          ></button>
          <div class="scroll-key" role="group" aria-label={t.moveCursor}>
            <button
              type="button"
              aria-label={t.previousNote}
              {@attach pressable(() => press('left', false))}>‹</button
            >
            <button
              type="button"
              aria-label={t.nextNote}
              {@attach pressable(() => press('right', false))}>›</button
            >
          </div>
        </div>
      </div>

      <div class="keypad">
        {#each KEYPAD as key (key)}
          <button
            type="button"
            class="key"
            aria-label={`${key}, ${t.keys[key]}`}
            {@attach pressable((long) => press(key, long))}
          >
            <span class="digit">{key}</span>
            {#if NOTE_LETTERS[key]}<span class="hint">{NOTE_LETTERS[key]}</span
              >{/if}
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .retro {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  /*
   * Phone modeled on the Nokia 3310 (113 x 48 mm, about 2.3:1), without the
   * brand. Every size is in cqw (percent of the phone width), so the phone
   * scales as a whole. Its width follows the available height, so that the
   * keypad stays reachable without scrolling on most phones.
   */
  .phone {
    --shell: #353a5c;
    --shell-light: #4c527a;
    --shell-dark: #262a44;
    --silver: #dfe3e8;
    --silver-dark: #a9b0bb;
    --key-ink: #2c2f3a;
    --navi-line: #3b8fe0;

    container-type: inline-size;
    width: clamp(12.5rem, calc((100dvh - 16rem) / 2.35), 17rem);
    max-width: 100%;
    margin: 0 auto;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }

  .body {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 11cqw 6cqw 20cqw;
    border-radius: 24cqw 24cqw 30cqw 30cqw / 12cqw 12cqw 16cqw 16cqw;
    background:
      linear-gradient(
        100deg,
        transparent 30%,
        rgb(255 255 255 / 0.12) 45%,
        transparent 60%
      ),
      linear-gradient(var(--shell-light), var(--shell) 30%, var(--shell-dark));
    box-shadow:
      inset 0 0 0 0.6cqw rgb(255 255 255 / 0.08),
      inset 0 -2cqw 4cqw rgb(0 0 0 / 0.3),
      0 3cqw 7cqw rgb(0 0 0 / 0.4);
  }

  /* Earpiece: a vertical row of slots. */
  .speaker {
    display: flex;
    flex-direction: column;
    gap: 2cqw;
    margin-bottom: 11cqw;
  }

  .speaker span {
    width: 4.5cqw;
    height: 1cqw;
    border-radius: 1cqw;
    background: rgb(0 0 0 / 0.55);
    box-shadow: 0 0.3cqw 0 rgb(255 255 255 / 0.1);
  }

  /* The silver "lyre" around the screen, widening around the Navi key. */
  .frame {
    width: 100%;
    padding: 2.6cqw 2.6cqw 0;
    border-radius: 22cqw 22cqw 40cqw 40cqw / 16cqw 16cqw 30cqw 30cqw;
    background: linear-gradient(var(--silver), var(--silver-dark));
    box-shadow:
      inset 0 0.5cqw 0.8cqw rgb(255 255 255 / 0.7),
      0 1cqw 2cqw rgb(0 0 0 / 0.35);
  }

  .face {
    padding: 12cqw 7cqw 10cqw;
    border-radius: 19cqw 19cqw 26cqw 26cqw / 13cqw 13cqw 15cqw 15cqw;
    background: linear-gradient(var(--shell), var(--shell-dark));
    box-shadow: inset 0 0.8cqw 2cqw rgb(0 0 0 / 0.5);
  }

  button {
    font: inherit;
    border: 0;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  /*
   * Under the screen, as on the real 3310: a wide flat Navi key straddling
   * the bottom of the screen surround, then the C key (left) and the scroll
   * key (right) tilted along the "V" of the silver frame, hanging over the
   * shell. Positions measured on a photo, in cqw (percent of phone width).
   * The frame starts 8.6cqw from the phone's left edge (body + frame padding).
   */
  .controls {
    position: relative;
    height: 22cqw;
  }

  .navi {
    position: absolute;
    left: 50%;
    top: -4cqw;
    width: 34cqw;
    height: 8.5cqw;
    border-radius: 50%;
    transform: translateX(-50%);
    background: linear-gradient(#f6f8fa, #c9cfd7);
    box-shadow:
      inset 0 -0.8cqw 0 rgb(0 0 0 / 0.12),
      0 0.6cqw 1.2cqw rgb(0 0 0 / 0.35);
  }

  /* The thin blue line of the 3310 Navi key. */
  .navi::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 36%;
    height: 1cqw;
    border-radius: 1cqw;
    background: var(--navi-line);
    transform: translate(-50%, -50%);
  }

  .c-key,
  .scroll-key {
    position: absolute;
    background: linear-gradient(#eef0f3, #b5bcc7);
    color: var(--key-ink);
    box-shadow:
      inset 0 -0.8cqw 0 rgb(0 0 0 / 0.12),
      0 0.8cqw 1.4cqw rgb(0 0 0 / 0.4);
  }

  /* Left arm of the V: tilted down towards the center. */
  .c-key {
    left: 2cqw;
    top: 7cqw;
    width: 19cqw;
    height: 12cqw;
    border-radius: 3.5cqw 5cqw 3.5cqw 5cqw;
    transform: rotate(24deg);
    font-size: 5cqw;
    font-weight: 700;
  }

  /* Right arm of the V: wider, tilted up towards the edge. */
  .scroll-key {
    right: -2cqw;
    top: 6cqw;
    display: flex;
    width: 29cqw;
    height: 12.5cqw;
    overflow: hidden;
    border-radius: 5cqw 3.5cqw 5cqw 3.5cqw;
    transform: rotate(-24deg);
  }

  .scroll-key button {
    flex: 1;
    padding: 0;
    background: none;
    color: var(--key-ink);
    font-size: 6cqw;
    font-weight: 700;
    line-height: 1;
  }

  .scroll-key button + button {
    border-left: 0.3cqw solid rgb(0 0 0 / 0.12);
  }

  .navi:active,
  .c-key:active,
  .scroll-key button:active,
  .key:active {
    filter: brightness(0.88);
  }

  /* Oval keys on a "smile": outer columns higher and tilted. */
  .keypad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6.5cqw 4.5cqw;
    width: 92%;
    margin-top: 10cqw;
  }

  .key {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 1cqw;
    height: 11.5cqw;
    border-radius: 50%;
    background: radial-gradient(
      120% 90% at 50% 20%,
      #f6f7f9,
      #c3c9d2 70%,
      #a3abb6
    );
    color: var(--key-ink);
    box-shadow:
      inset 0 -0.8cqw 0 rgb(0 0 0 / 0.1),
      0 0.8cqw 1.2cqw rgb(0 0 0 / 0.4);
    padding-top: 2cqw;
  }

  .key:nth-child(3n + 1) {
    transform: translateY(-2cqw) rotate(9deg);
  }

  .key:nth-child(3n + 2) {
    transform: translateY(1.5cqw);
  }

  .key:nth-child(3n) {
    transform: translateY(-2cqw) rotate(-9deg);
  }

  .digit {
    font-size: 6cqw;
    font-weight: 700;
  }

  .hint {
    font-size: 3.4cqw;
    opacity: 0.7;
  }
</style>
