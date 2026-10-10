/**
 * Current language of the interface (reactive). Defaults to the browser
 * language; the user's choice is remembered on this device.
 */
import { readSetting, writeSetting } from '../ui/shared/storage';
import { en } from './en';
import { fr, type Messages } from './fr';
import { detectLocale, isLocale, type Locale, type Localized } from './locale';

const DICTIONARIES: Record<Locale, Messages> = { fr, en };
const SETTING = 'locale';

function initialLocale(): Locale {
  const saved = readSetting(SETTING);
  if (isLocale(saved)) return saved;
  if (typeof navigator === 'undefined') return detectLocale([]);
  return detectLocale(navigator.languages ?? [navigator.language]);
}

class I18n {
  locale = $state<Locale>(initialLocale());

  constructor() {
    this.#applyToDocument();
  }

  /** Texts of the current language. */
  get t(): Messages {
    return DICTIONARIES[this.locale];
  }

  /** Picks the current language's version of a localized text. */
  pick(text: Localized): string {
    return text[this.locale];
  }

  setLocale(locale: Locale): void {
    this.locale = locale;
    writeSetting(SETTING, locale);
    this.#applyToDocument();
  }

  /** `<html lang>` drives screen readers, hyphenation and spell checking. */
  #applyToDocument(): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = this.locale;
    }
  }
}

export const i18n = new I18n();
