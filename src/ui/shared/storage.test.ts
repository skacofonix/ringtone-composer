import { describe, expect, it } from 'vitest';
import { tone, type Melody } from '../../core/melody';
import {
  loadSavedMelody,
  readSetting,
  saveMelody,
  writeSetting,
} from './storage';

/** Minimal in-memory Storage. */
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}

/** A Storage that throws on every call, like Safari with blocked cookies. */
function brokenStorage(): Storage {
  const fail = () => {
    throw new Error('SecurityError');
  };
  return {
    length: 0,
    clear: fail,
    getItem: fail,
    key: fail,
    removeItem: fail,
    setItem: fail,
  };
}

const melody: Melody = {
  name: 'Test',
  bpm: 140,
  notes: [tone('c', 5, 8), tone('d#', 6, 4, true)],
};

describe('melody persistence', () => {
  it('round-trips a melody', () => {
    const storage = memoryStorage();
    saveMelody(melody, storage);
    expect(loadSavedMelody(storage)).toEqual(melody);
  });

  it('returns null when nothing is saved', () => {
    expect(loadSavedMelody(memoryStorage())).toBeNull();
  });

  it('returns null for corrupted data', () => {
    const storage = memoryStorage();
    writeSetting('melody', 'not rtttl', storage);
    expect(loadSavedMelody(storage)).toBeNull();
  });

  it('survives a storage that throws', () => {
    const storage = brokenStorage();
    expect(() => saveMelody(melody, storage)).not.toThrow();
    expect(loadSavedMelody(storage)).toBeNull();
  });

  it('works without storage at all', () => {
    expect(readSetting('mode', undefined)).toBeNull();
  });
});
