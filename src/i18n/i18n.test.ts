import { describe, expect, it } from 'vitest';
import { en } from './en';
import { fr } from './fr';
import { detectLocale, FALLBACK_LOCALE, isLocale } from './locale';

describe('detectLocale', () => {
  it('uses the first supported browser language', () => {
    expect(detectLocale(['fr-FR', 'en-US'])).toBe('fr');
    expect(detectLocale(['en-GB', 'fr'])).toBe('en');
    expect(detectLocale(['de-DE', 'fr-CA'])).toBe('fr');
  });

  it('is case insensitive', () => {
    expect(detectLocale(['FR-be'])).toBe('fr');
  });

  it('falls back to English', () => {
    expect(detectLocale(['de', 'es'])).toBe(FALLBACK_LOCALE);
    expect(detectLocale([])).toBe(FALLBACK_LOCALE);
  });

  it('validates locales', () => {
    expect(isLocale('fr')).toBe(true);
    expect(isLocale('de')).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
});

/** Every key path of a dictionary, with the kind of value. */
function shape(value: unknown, path = ''): string[] {
  if (Array.isArray(value)) return [`${path}[${value.length}]`];
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).flatMap(([k, v]) => shape(v, `${path}.${k}`));
  }
  return [`${path}:${typeof value}`];
}

describe('dictionaries', () => {
  it('have the same keys, kinds and list lengths', () => {
    expect(shape(en)).toEqual(shape(fr));
  });

  it('have no empty text', () => {
    for (const dictionary of [fr, en]) {
      const texts = JSON.stringify(dictionary);
      expect(texts).not.toContain('""');
    }
  });
});
