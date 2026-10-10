/**
 * Per-device persistence in localStorage. Storage can be unavailable or throw
 * (private browsing, blocked site data): every access is guarded and the app
 * works without it.
 */
import type { Melody } from '../../core/melody';
import { parseRtttl, serializeRtttl } from '../../core/rtttl';

const PREFIX = 'ringtone-composer:';
const MELODY_KEY = 'melody';

function defaultStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export function readSetting(
  key: string,
  storage = defaultStorage(),
): string | null {
  try {
    return storage?.getItem(PREFIX + key) ?? null;
  } catch {
    return null;
  }
}

export function writeSetting(
  key: string,
  value: string,
  storage = defaultStorage(),
): void {
  try {
    storage?.setItem(PREFIX + key, value);
  } catch {
    // Quota exceeded or storage blocked: nothing useful to do.
  }
}

/** The melody saved by the last session, or `null`. */
export function loadSavedMelody(storage = defaultStorage()): Melody | null {
  const text = readSetting(MELODY_KEY, storage);
  if (text === null) return null;
  try {
    return parseRtttl(text);
  } catch {
    return null;
  }
}

/** Saves the melody as RTTTL, the app's interchange format. */
export function saveMelody(melody: Melody, storage = defaultStorage()): void {
  writeSetting(MELODY_KEY, serializeRtttl(melody), storage);
}
