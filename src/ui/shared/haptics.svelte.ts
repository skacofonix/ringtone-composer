/**
 * Haptic feedback on key presses.
 *
 * - Android browsers: the Vibration API (`navigator.vibrate`).
 * - iPhone (iOS 18+): Safari has no Vibration API, but it plays a system
 *   haptic tick when an `<input type="checkbox" switch>` is toggled. Clicking
 *   a hidden one gives the tick (unofficial technique, as used by the
 *   `ios-haptics` library; it may stop working in a future iOS).
 *
 * On by default, the choice is remembered on this device.
 */
import { readSetting, writeSetting } from './storage';

/** Vibration lengths in milliseconds: a light tap, and a long press. */
export const PATTERNS = { tap: 8, long: 30 } as const;
export type HapticKind = keyof typeof PATTERNS;

/** On iPhone, a long press is two ticks this far apart. */
const DOUBLE_TICK_MS = 70;

const SETTING = 'haptics';

type Method = 'vibrate' | 'switch' | null;

function detectMethod(): Method {
  if (typeof navigator === 'undefined') return null;
  if (typeof navigator.vibrate === 'function') return 'vibrate';
  // Safari 17.4+ knows the switch attribute; only touch devices have haptics.
  const switchInputs =
    typeof HTMLInputElement !== 'undefined' &&
    'switch' in HTMLInputElement.prototype;
  return switchInputs && navigator.maxTouchPoints > 0 ? 'switch' : null;
}

/** One system haptic tick through a hidden, throwaway switch input. */
function switchTick(): void {
  const label = document.createElement('label');
  label.ariaHidden = 'true';
  label.style.display = 'none';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  label.append(input);
  document.head.append(label);
  label.click();
  label.remove();
}

class Haptics {
  readonly #method = detectMethod();

  /** Whether this device can give haptic feedback at all. */
  readonly supported = this.#method !== null;

  enabled = $state(readSetting(SETTING) !== 'off');

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    writeSetting(SETTING, enabled ? 'on' : 'off');
    if (enabled) this.play('tap');
  }

  /** Gives feedback if supported and enabled. Call it inside a user gesture. */
  play(kind: HapticKind): void {
    if (!this.enabled) return;
    try {
      if (this.#method === 'vibrate') {
        navigator.vibrate(PATTERNS[kind]);
      } else if (this.#method === 'switch') {
        switchTick();
        if (kind === 'long') setTimeout(switchTick, DOUBLE_TICK_MS);
      }
    } catch {
      // Some browsers throw when vibration is blocked: ignore.
    }
  }
}

export const haptics = new Haptics();
