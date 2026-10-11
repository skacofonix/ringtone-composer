/**
 * The "Options" menu of the Composer, shown on the LCD. Pure state machine:
 * keys go in, a new state and an optional action come out. The Svelte
 * component performs the actions; screen.ts draws the state.
 *
 * Keys, as on the 3310: scroll key up / down, Navi key to select, C to go
 * back, digits to jump to an item.
 */
import { INSTRUMENT_IDS, type InstrumentId } from '../../audio/instruments';
import { CLASSICS } from '../../catalog/classics';

export const OPTIONS = [
  'play',
  'tempo',
  'instrument',
  'classics',
  'share',
  'ringtone',
  'clear',
  'exit',
] as const;
export type OptionId = (typeof OPTIONS)[number];

/** Options that need notes: hidden when the melody is empty. */
const NEEDS_NOTES = new Set<OptionId>(['play', 'share', 'ringtone', 'clear']);

/** Tempos of the Nokia Smart Messaging specification, in BPM. */
export const NOKIA_TEMPOS = [
  25, 28, 31, 35, 40, 45, 50, 56, 63, 70, 80, 90, 100, 112, 125, 140, 160, 180,
  200, 225, 250, 285, 320, 355, 400, 450, 500, 565, 635, 715, 800, 900,
] as const;

export type MenuState =
  | {
      readonly screen: 'options';
      readonly items: readonly OptionId[];
      readonly index: number;
    }
  | { readonly screen: 'instrument'; readonly index: number }
  | { readonly screen: 'classics'; readonly index: number }
  | { readonly screen: 'tempo'; readonly bpm: number };

export type MenuKey = 'up' | 'down' | 'select' | 'back' | number;

export type MenuAction =
  | { readonly type: 'play' }
  | { readonly type: 'setBpm'; readonly bpm: number }
  | { readonly type: 'setInstrument'; readonly instrument: InstrumentId }
  | { readonly type: 'previewInstrument'; readonly instrument: InstrumentId }
  | { readonly type: 'loadClassic'; readonly id: string }
  | { readonly type: 'share' }
  | { readonly type: 'ringtone' }
  | { readonly type: 'clearAll' };

/** What the menu needs to know about the composition. */
export interface MenuContext {
  readonly bpm: number;
  readonly instrument: InstrumentId;
  readonly hasNotes: boolean;
}

export interface MenuResult {
  /** `null` closes the menu (back to the composer screen). */
  readonly state: MenuState | null;
  readonly action?: MenuAction;
}

export function openMenu(context: MenuContext): MenuState {
  const items = OPTIONS.filter(
    (id) => context.hasNotes || !NEEDS_NOTES.has(id),
  );
  return { screen: 'options', items, index: 0 };
}

/** Number of items of a list screen; 0 for the tempo screen. */
export function itemCount(state: MenuState): number {
  switch (state.screen) {
    case 'options':
      return state.items.length;
    case 'instrument':
      return INSTRUMENT_IDS.length;
    case 'classics':
      return CLASSICS.length;
    case 'tempo':
      return 0;
  }
}

/** The tempo of the table closest to `bpm`. */
export function nearestTempo(bpm: number): number {
  return NOKIA_TEMPOS.reduce((best, tempo) =>
    Math.abs(tempo - bpm) < Math.abs(best - bpm) ? tempo : best,
  );
}

export function menuPress(
  state: MenuState,
  key: MenuKey,
  context: MenuContext,
): MenuResult {
  if (state.screen === 'tempo') return tempoPress(state, key, context);

  const count = itemCount(state);
  if (key === 'back') {
    // From a sub-list back to the options; from the options, close.
    return { state: state.screen === 'options' ? null : openMenu(context) };
  }
  if (key === 'up' || key === 'down') {
    // The list wraps around, like on the phone.
    const index = (state.index + (key === 'down' ? 1 : count - 1)) % count;
    const next = { ...state, index };
    return {
      state: next,
      action:
        next.screen === 'instrument'
          ? { type: 'previewInstrument', instrument: INSTRUMENT_IDS[index]! }
          : undefined,
    };
  }
  // Select, or jump to an item with its number (1 = first).
  const index = key === 'select' ? state.index : key - 1;
  if (index < 0 || index >= count) return { state };
  return select({ ...state, index }, context);
}

function select(state: MenuState, context: MenuContext): MenuResult {
  switch (state.screen) {
    case 'options':
      return selectOption(state.items[state.index]!, context);
    case 'instrument':
      return {
        state: null,
        action: {
          type: 'setInstrument',
          instrument: INSTRUMENT_IDS[state.index]!,
        },
      };
    case 'classics':
      return {
        state: null,
        action: { type: 'loadClassic', id: CLASSICS[state.index]!.id },
      };
    case 'tempo':
      return { state };
  }
}

function selectOption(option: OptionId, context: MenuContext): MenuResult {
  switch (option) {
    case 'play':
      return { state: null, action: { type: 'play' } };
    case 'tempo':
      return { state: { screen: 'tempo', bpm: nearestTempo(context.bpm) } };
    case 'instrument':
      return {
        state: {
          screen: 'instrument',
          index: INSTRUMENT_IDS.indexOf(context.instrument),
        },
      };
    case 'classics':
      return { state: { screen: 'classics', index: 0 } };
    case 'share':
      return { state: null, action: { type: 'share' } };
    case 'ringtone':
      return { state: null, action: { type: 'ringtone' } };
    case 'clear':
      return { state: null, action: { type: 'clearAll' } };
    case 'exit':
      return { state: null };
  }
}

function tempoPress(
  state: Extract<MenuState, { screen: 'tempo' }>,
  key: MenuKey,
  context: MenuContext,
): MenuResult {
  if (key === 'back') return { state: openMenu(context) };
  if (key === 'select') {
    return { state: null, action: { type: 'setBpm', bpm: state.bpm } };
  }
  if (key === 'up' || key === 'down') {
    const position = NOKIA_TEMPOS.indexOf(
      state.bpm as (typeof NOKIA_TEMPOS)[number],
    );
    const next = Math.min(
      NOKIA_TEMPOS.length - 1,
      Math.max(0, position + (key === 'down' ? 1 : -1)),
    );
    return { state: { screen: 'tempo', bpm: NOKIA_TEMPOS[next]! } };
  }
  return { state };
}
