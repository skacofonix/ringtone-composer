import { describe, expect, it } from 'vitest';
import { INSTRUMENT_IDS } from '../../audio/instruments';
import { CLASSICS } from '../../catalog/classics';
import {
  itemCount,
  menuPress,
  nearestTempo,
  NOKIA_TEMPOS,
  openMenu,
  OPTIONS,
  type MenuContext,
  type MenuKey,
  type MenuState,
} from './menu';

const context: MenuContext = { bpm: 120, instrument: 'flute', hasNotes: true };

/** Presses several keys, returning the last result. */
function pressAll(state: MenuState | null, keys: MenuKey[]) {
  let result = { state } as ReturnType<typeof menuPress>;
  for (const key of keys) {
    if (!result.state) throw new Error('menu closed too early');
    result = menuPress(result.state, key, context);
  }
  return result;
}

describe('options', () => {
  it('opens on the first option, Play', () => {
    const menu = openMenu(context);
    expect(menu).toEqual({ screen: 'options', items: OPTIONS, index: 0 });
  });

  it('hides the options that need notes', () => {
    const menu = openMenu({ ...context, hasNotes: false });
    expect(menu.screen === 'options' && menu.items).toEqual([
      'tempo',
      'instrument',
      'classics',
      'exit',
    ]);
  });

  it('wraps around when scrolling', () => {
    const { state } = pressAll(openMenu(context), ['up']);
    expect(state).toMatchObject({ index: OPTIONS.length - 1 });
    expect(pressAll(state, ['down']).state).toMatchObject({ index: 0 });
  });

  it('plays and closes on Play', () => {
    expect(pressAll(openMenu(context), ['select'])).toEqual({
      state: null,
      action: { type: 'play' },
    });
  });

  it('jumps to an item with its number', () => {
    expect(pressAll(openMenu(context), [5]).action).toEqual({ type: 'share' });
    expect(pressAll(openMenu(context), [9]).state).toMatchObject({ index: 0 });
  });

  it('closes on back or Exit', () => {
    expect(pressAll(openMenu(context), ['back']).state).toBeNull();
    expect(pressAll(openMenu(context), [8])).toEqual({ state: null });
  });

  it('clears everything (undoable, so no confirmation)', () => {
    expect(pressAll(openMenu(context), [7]).action).toEqual({
      type: 'clearAll',
    });
  });
});

describe('tempo screen', () => {
  it('starts from the nearest tempo of the Nokia table', () => {
    expect(nearestTempo(120)).toBe(125);
    expect(nearestTempo(225)).toBe(225);
    expect(pressAll(openMenu(context), [2]).state).toEqual({
      screen: 'tempo',
      bpm: 125,
    });
  });

  it('steps through the table, within its bounds', () => {
    expect(pressAll(openMenu(context), [2, 'down', 'down']).state).toEqual({
      screen: 'tempo',
      bpm: 160,
    });
    const slowest = { screen: 'tempo', bpm: NOKIA_TEMPOS[0] } as const;
    expect(menuPress(slowest, 'up', context).state).toEqual(slowest);
  });

  it('sets the tempo on select, cancels on back', () => {
    expect(pressAll(openMenu(context), [2, 'down', 'select'])).toEqual({
      state: null,
      action: { type: 'setBpm', bpm: 140 },
    });
    expect(pressAll(openMenu(context), [2, 'back']).state).toMatchObject({
      screen: 'options',
    });
  });
});

describe('instrument list', () => {
  it('starts on the current instrument and previews while scrolling', () => {
    const open = pressAll(openMenu(context), [3]);
    expect(open.state).toEqual({
      screen: 'instrument',
      index: INSTRUMENT_IDS.indexOf('flute'),
    });
    expect(pressAll(open.state, ['down']).action).toEqual({
      type: 'previewInstrument',
      instrument: 'organ',
    });
  });

  it('sets the instrument on select', () => {
    expect(pressAll(openMenu(context), [3, 'down', 'select'])).toEqual({
      state: null,
      action: { type: 'setInstrument', instrument: 'organ' },
    });
  });

  it('goes back to the options', () => {
    expect(pressAll(openMenu(context), [3, 'back']).state).toMatchObject({
      screen: 'options',
    });
  });
});

describe('classics list', () => {
  it('loads the chosen classic', () => {
    expect(pressAll(openMenu(context), [4, 'down', 'select'])).toEqual({
      state: null,
      action: { type: 'loadClassic', id: CLASSICS[1]!.id },
    });
  });

  it('counts its items', () => {
    const state = pressAll(openMenu(context), [4]).state!;
    expect(itemCount(state)).toBe(CLASSICS.length);
  });
});
