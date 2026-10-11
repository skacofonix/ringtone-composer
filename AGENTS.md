# AGENTS.md

Reference guide for coding agents (Claude Code, Codex, Copilot…) and humans contributing to **RingtoneComposer**.
This file is the source of truth; `CLAUDE.md` imports it.

## The project

A ringtone composer in the style of the early-2000s Nokia phones (3310), as an installable **PWA** for Android and iPhone.

Users can:

1. **Compose** a monophonic melody, note by note;
2. **Play** it with a "buzzer" sound (square wave) or another synthesized instrument;
3. **Save / import / share** the melody as **RTTTL** text (including through a link);
4. **Export an audio file** to use it as a ringtone, or a MIDI file;
5. **Load a classic** from a preloaded catalog (Nokia Tune, Tetris…).

Two input modes, plugged into **the same melody model**:

- **Retro**: a Nokia 3310 with a pixelated monochrome LCD and a T9 keypad, reproducing the original "Composer";
- **Modern**: a piano keyboard and a clear view of notes and durations.

## Stack

| Topic              | Choice                                                                          |
| ------------------ | ------------------------------------------------------------------------------- |
| Build / dev server | [Vite](https://vite.dev)                                                        |
| Language           | TypeScript (`strict`)                                                           |
| UI                 | [Svelte 5](https://svelte.dev) (runes: `$state`, `$derived`, `$props`)          |
| PWA                | `vite-plugin-pwa` (manifest + service worker, works offline)                    |
| Audio              | Web Audio API: synthesized instruments, `OfflineAudioContext` for the export    |
| Tests              | Vitest                                                                          |
| Quality            | ESLint (`typescript-eslint`, `eslint-plugin-svelte`) + Prettier                 |
| Package manager    | npm                                                                             |
| Node               | see `.nvmrc`                                                                    |
| Hosting            | GitHub Pages, deployed by `.github/workflows/pages.yml` on every push to `main` |

No backend. Everything runs in the browser. Sharing goes through the URL: the RTTTL is encoded in the `#` fragment.

## Architecture

```
src/
  core/          # pure TypeScript, NO dependency on the DOM or Svelte, unit tested
    melody.ts      # model: Melody, Note = Tone | Rest, frequencies and durations
    editor.ts      # editing operations (insertion cursor, add, delete, tempo)
    rtttl.ts       # RTTTL parse / serialize (lossless round trip)
    nokia.ts       # Nokia Composer notation + T9 keypad state machine
    keypress.ts    # magazine key sequences (`5 9 (6) 8 #**`): read and write
    history.ts     # undo / redo with grouping of continuous edits
    share.ts       # melody (and instrument) encoded in the URL
    midi.ts        # Standard MIDI File export (.mid)
  audio/         # depends on the Web Audio API
    schedule.ts    # melody -> timeline (start, duration, frequency), pure and tested
    player.ts      # real-time playback, single-note preview
    instruments.ts # synthesized instruments described as data (partials, ADSR, FM)
    synth.ts       # one voice per note, shared by playback and export
    render.ts      # offline rendering -> PCM (OfflineAudioContext), normalized
    encoders/      # PCM -> WAV (home-made)
  catalog/       # classic ringtones in RTTTL (data), translated titles
  i18n/          # translations: fr.ts (reference), en.ts, language detection
  ui/
    retro/         # Nokia 3310: pixelated LCD + T9 keypad + "Options" menu on the LCD (menu.ts)
    modern/        # piano + note editor
    shared/        # shared state (composition.svelte.ts), bottom bar, "More" menu, dialogs (classics, share, ringtone, RTTTL, Nokia keys, help), icons, theme, storage
  App.svelte
  main.ts
docs/            # specifications (RTTTL, Nokia notation…), in English with French versions (*.fr.md)
```

**Golden rule:** the UI never handles an RTTTL string directly. It works on the `Melody` model of `src/core`; RTTTL is only an input/output format. All non-visual logic (T9 keypad navigation, octave change, duration computation…) goes into `core/` and is tested.

> The tree above reflects the current code; update it when the structure changes. The catalog only contains public-domain works: do not add film, TV or game themes that are still under copyright.
>
> `ui/retro/` also contains a 5×7 bitmap font (`font.ts`) and a pure renderer of the 84×48 screen (`screen.ts`, tested) that `Lcd.svelte` only paints. `ui/shared/storage.ts` saves the melody (as RTTTL), the mode, the instrument, the language and the theme in `localStorage`.
>
> A first version in C# (Xamarin, 2015) exists: <https://github.com/skacofonix/RingtoneComposer>. Its `RingtoneComposer.Core/Business/Converter/` folder is a good domain reference (RTTTL, Nokia notation, key sequences). The useful points are summarized in `docs/`.

## Commands

```bash
npm install          # install dependencies
npm run dev          # dev server (add --host to test on a phone on the local network)
npm run build        # production build in dist/
npm run preview      # serve the build (needed to test the service worker / PWA)
npm test             # unit tests (Vitest)
npm run check        # type checking (svelte-check + tsc)
npm run lint         # ESLint
npm run format       # Prettier (writes the files)
npm run verify       # everything the CI checks: format, lint, types, tests, build
```

Before considering a task done, `npm run verify` must pass. The GitHub Actions CI (`.github/workflows/ci.yml`) runs the same command.

## Conventions

- **Language:** code, identifiers and comments are in English. Documentation is in English, with a French version next to it (`README.md` / `README.fr.md`, `docs/x.md` / `docs/x.fr.md`): keep both in sync when you change one. `AGENTS.md` and `CLAUDE.md` exist in English only, so that agents have a single source of truth; so do the GitHub community files (`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, issue and pull request templates in `.github/`) and `CHANGELOG.md`.
- **Screen layout (mobile first):** a minimal header (title + mode), a one-line melody summary (name · tempo · instrument) that opens the settings, the composition area, and a fixed bottom bar (Classics, Share, **Play** in the center, Ringtone, More). Undo / redo sit in the header. Rare actions (RTTTL text, Nokia keys, help, clear all, theme, language) go into the "More" menu. In modern mode, the bar under the score edits the current note (the one before the cursor), like keys 8 / 9 / * / # in retro mode. Do not add permanent blocks back under the composition area.
- **Icons:** Lucide set copied into `ui/shared/Icon.svelte` (no dependency). The "Share" icon follows the platform convention (`ui/shared/platform.ts`).
- **Interface texts:** never hard-coded in components. Add the key to `src/i18n/fr.ts` (the reference) **and** to `src/i18n/en.ts`: TypeScript and a test check that both dictionaries have the same keys. Use them through `i18n.t.…` (`src/i18n/i18n.svelte.ts`). The core (`core/`) contains no displayed text: for example, RTTTL parser errors carry a `code` that the UI translates. By default the app uses the browser language (French if it starts with `fr`, English otherwise); the user's choice is remembered.
- **Colors:** CSS lives in the components (scoped). Colors **only through the tokens** of `src/app.css` (`--bg`, `--surface`, `--text`, `--accent`…), never hard-coded, so that the light and dark themes work. Three states: system (no `data-theme`), `data-theme="light"` and `data-theme="dark"` on `<html>` (`ui/shared/theme.svelte.ts`); the dark values exist twice in `app.css` and must stay in sync. Exception: the 3310 phone keeps its own colors in both themes.
- TypeScript `strict`, no `any` without a justifying comment.
- Prefer pure functions and immutable data in `core/`. No classes when a function will do.
- Small Svelte components, one per file, named `PascalCase.svelte`.
- No new dependency without a clear reason. The project must stay understandable for a developer coming from vanilla JS.
- Short commit messages, imperative mood, in English (`Add RTTTL parser`).
- `main` is protected against force pushes and deletion (GitHub ruleset "Protect main").

## Releases

The project follows [Semantic Versioning](https://semver.org/); the version in `package.json` is shown in the app (menu "More", injected as `__APP_VERSION__` by `vite.config.ts`).

- Every user-visible change adds a line under `## [Unreleased]` in `CHANGELOG.md`.
- To release: move the `Unreleased` lines to a new `## [x.y.z] - date` section, update the links at the bottom, set the same version in `package.json` (`npm version x.y.z --no-git-tag-version`), commit, tag `vx.y.z` and create the GitHub release with that changelog section (`gh release create vx.y.z --notes-file …`).

## Domain notes

- **RTTTL:** see [docs/rtttl.md](docs/rtttl.md). The parser must tolerate real-world variants (spaces, upper case, `#` before or after the note, dot before or after the octave, missing defaults).
- **Nokia Composer:** notation like `8c2 8#d2 4g2`, with a T9 keypad where keys 1 to 7 give the notes and 0 a rest. See [docs/nokia-composer.md](docs/nokia-composer.md).
- **iOS audio:** the `AudioContext` must be created or resumed (`resume()`) inside a user gesture (tap), otherwise there is no sound. The iPhone silent switch can mute web audio (`navigator.audioSession` is set to `playback` to avoid it).
- **Setting a ringtone:** impossible from the web. The app exports a WAV file and guides the user (Android settings, GarageBand on iPhone). On iOS a ringtone lasts at most about 30 s.
- **Web Audio envelopes:** always anchor each stage with an explicit `setValueAtTime`. A `setTargetAtTime` right after a `linearRampToValueAtTime` diverges on some engines (tested: the level blows up). See `audio/synth.ts`.
- **Testing audio:** `OfflineAudioContext` does not exist in Node, and headless Edge renders it poorly. To check a rendering, use `node-web-audio-api` in a temporary folder (outside the project dependencies) and import `src/audio/render.ts`.
- **Polyphony:** out of scope for v1, RTTTL being monophonic by nature. Possible direction: several RTTTL voices played together (like the polyphonic ringtones of later Nokia phones), without breaking the mono model.

## Roadmap

1. ✅ Vite + Svelte + TS + PWA skeleton, tests in place
2. ✅ `core/`: `Melody` model, RTTTL parser and serializer (+ tests)
3. ✅ Audio player (square wave)
4. ✅ Modern mode (piano)
5. ✅ Retro Nokia 3310 mode (LCD + T9), autosave
6. ✅ Catalog of classics (public domain)
7. ✅ Share by link (RTTTL in the `#rtttl=` fragment)
8. ✅ WAV audio export + "use as ringtone" guide (Android, iPhone through GarageBand). Later, if needed: MP3 or M4R.
9. ✅ Instrument choice (6 synthesized instruments) + MIDI export. Possible next step: real General MIDI instruments (SoundFonts, e.g. `smplr`).
10. ✅ English / French interface, light / dark theme, simplified layout (bottom bar + "More" menu)
11. Polyphony (exploratory)
12. Later: Capacitor wrapper for Android (native "Set as ringtone" button, Play Store)
