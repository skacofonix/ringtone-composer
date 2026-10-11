/**
 * Light / dark theme. `system` follows the device setting; `light` and `dark`
 * force a theme through `data-theme` on <html> (see app.css). The choice is
 * remembered on this device; index.html applies it before the first paint.
 */
import { readSetting, writeSetting } from './storage';

export const THEMES = ['system', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

/** Must match the `--bg` tokens of app.css: the browser bar blends in. */
const BAR_COLORS = { light: '#f4f5f7', dark: '#14161b' } as const;

const SETTING = 'theme';

export function isTheme(value: unknown): value is Theme {
  return (THEMES as readonly unknown[]).includes(value);
}

class ThemeState {
  current = $state<Theme>(this.#saved());

  constructor() {
    // index.html already set data-theme; this also syncs the theme-color metas.
    this.#apply();
  }

  set(theme: Theme): void {
    this.current = theme;
    writeSetting(SETTING, theme);
    this.#apply();
  }

  #saved(): Theme {
    const saved = readSetting(SETTING);
    return isTheme(saved) ? saved : 'system';
  }

  #apply(): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (this.current === 'system') delete root.dataset.theme;
    else root.dataset.theme = this.current;

    // Each theme-color meta targets a system scheme; a forced theme wins both.
    for (const meta of document.querySelectorAll<HTMLMetaElement>(
      'meta[name="theme-color"]',
    )) {
      const scheme = meta.media.includes('dark') ? 'dark' : 'light';
      meta.content =
        BAR_COLORS[this.current === 'system' ? scheme : this.current];
    }
  }
}

export const theme = new ThemeState();
