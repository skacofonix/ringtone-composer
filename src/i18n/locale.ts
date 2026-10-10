/** Languages of the interface. Pure module: no DOM, no Svelte. */

export const LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** Used when none of the browser languages is supported. */
export const FALLBACK_LOCALE: Locale = 'en';

/** Native names, for the language picker. */
export const LOCALE_NAMES: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
};

/** A text available in every language (catalog titles…). */
export type Localized = Record<Locale, string>;

export function isLocale(value: unknown): value is Locale {
  return (LOCALES as readonly unknown[]).includes(value);
}

/**
 * First supported language among the browser preferences
 * (`navigator.languages`, most preferred first), e.g. `fr-CA` → `fr`.
 */
export function detectLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const base = language.toLowerCase().split('-')[0];
    if (isLocale(base)) return base;
  }
  return FALLBACK_LOCALE;
}
