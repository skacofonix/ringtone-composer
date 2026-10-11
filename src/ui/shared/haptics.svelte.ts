/**
 * Haptic feedback on key presses, through the Vibration API. Supported by
 * Android browsers; not by Safari on iPhone, where the setting is shown as
 * unavailable. On by default, the choice is remembered on this device.
 */
import { readSetting, writeSetting } from './storage';

/** Vibration lengths in milliseconds: a light tap, and a long press. */
export const PATTERNS = { tap: 8, long: 30 } as const;
export type HapticKind = keyof typeof PATTERNS;

const SETTING = 'haptics';

class Haptics {
  /** Whether this browser can vibrate at all. */
  readonly supported =
    typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

  enabled = $state(readSetting(SETTING) !== 'off');

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    writeSetting(SETTING, enabled ? 'on' : 'off');
    if (enabled) this.play('tap');
  }

  /** Vibrates if supported and enabled. Must run inside a user gesture. */
  play(kind: HapticKind): void {
    if (!this.supported || !this.enabled) return;
    try {
      navigator.vibrate(PATTERNS[kind]);
    } catch {
      // Some browsers throw when vibration is blocked: ignore.
    }
  }
}

export const haptics = new Haptics();
