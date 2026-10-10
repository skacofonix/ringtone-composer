import { describe, expect, it } from 'vitest';
import { rest, tone, type Melody } from './melody';
import { melodyFromUrl, shareUrl } from './share';

const melody: Melody = {
  name: 'Ma sonnerie #1',
  bpm: 140,
  notes: [tone('c#', 5, 8), rest(4, true), tone('a', 6, 2)],
};

const BASE = 'https://skacofonix.github.io/ringtone-composer/';

describe('share links', () => {
  it('round-trips a melody, including # and spaces', () => {
    const url = shareUrl(melody, BASE);
    expect(melodyFromUrl(url)).toEqual(melody);
  });

  it('keeps the app path and puts the melody in the fragment', () => {
    const url = new URL(shareUrl(melody, BASE));
    expect(url.pathname).toBe('/ringtone-composer/');
    expect(url.search).toBe('');
    expect(url.hash).toMatch(/^#rtttl=/);
  });

  it('replaces an existing fragment', () => {
    const url = shareUrl(melody, `${BASE}#old`);
    expect(url).not.toContain('old');
  });

  it('returns null without melody or with an invalid one', () => {
    expect(melodyFromUrl(BASE)).toBeNull();
    expect(melodyFromUrl(`${BASE}#other=1`)).toBeNull();
    expect(melodyFromUrl(`${BASE}#rtttl=nonsense`)).toBeNull();
  });
});
