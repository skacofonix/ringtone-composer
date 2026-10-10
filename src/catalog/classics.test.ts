import { describe, expect, it } from 'vitest';
import { melodyDurationMs } from '../core/melody';
import { parseRtttl } from '../core/rtttl';
import { CLASSICS } from './classics';

describe('catalog', () => {
  it.each(CLASSICS.map((c) => [c.id, c] as const))(
    '%s is valid RTTTL',
    (_, entry) => {
      const melody = parseRtttl(entry.rtttl);
      expect(melody.notes.length).toBeGreaterThan(5);
      expect(melody.name).not.toBe('');
    },
  );

  it.each(CLASSICS.map((c) => [c.id, c] as const))(
    '%s fits in an iPhone ringtone (30 s)',
    (_, entry) => {
      expect(melodyDurationMs(parseRtttl(entry.rtttl))).toBeLessThan(30_000);
    },
  );

  it('has unique ids', () => {
    const ids = CLASSICS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
