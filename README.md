# RingtoneComposer 📟

**English** · [Français](README.fr.md)

[![CI](https://github.com/skacofonix/ringtone-composer/actions/workflows/ci.yml/badge.svg)](https://github.com/skacofonix/ringtone-composer/actions/workflows/ci.yml)
[![Deploy](https://github.com/skacofonix/ringtone-composer/actions/workflows/pages.yml/badge.svg)](https://github.com/skacofonix/ringtone-composer/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Compose ringtones like on a Nokia 3310, right from your smartphone.

An installable web app (PWA) to compose, play, share and export ringtones in the **RTTTL** format. Two input modes:

- **Retro**: the LCD screen and T9 keypad of the Nokia 3310, just like in 2000;
- **Modern**: a piano keyboard, easier for composing.

👉 **Try it: <https://skacofonix.github.io/ringtone-composer/>** (can be installed on your home screen).

![Retro 3310 mode in dark theme and modern piano mode in light theme](docs/images/screenshot.png)

> 🚧 Being rebuilt from scratch. Previous version (C#, 2015): <https://github.com/skacofonix/RingtoneComposer>

## Features

- Note-by-note composition, in retro or modern mode
- Playback with an authentic "buzzer" sound
- RTTTL text import and export
- Catalog of public-domain classics (Nokia Tune, Tetris, Für Elise…)
- Share by link
- Choice of instrument: Nokia buzzer, 8-bit console, flute, organ, music box, electric piano
- Audio export to use as a ringtone (Android and iPhone), and MIDI export
- Works offline
- Light and dark themes (follows the system by default)
- Haptic feedback on key presses (Android, iPhone with iOS 18+), can be turned off
- In English and French (browser language by default, can be changed)

## Use it as a ringtone

A web app cannot change the phone's ringtone by itself. The app exports a WAV file, then:

- **Android**: Settings → Sound → Phone ringtone → pick the downloaded file;
- **iPhone**: import the file in GarageBand, then Share → Ringtone (step-by-step guide in the app).

## Development

Requirements: Node.js (version in `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:5173
npm run verify     # format, lint, types, tests and build, as in CI
```

To test on your phone, run `npm run dev -- --host` and open the displayed IP address from a device on the same Wi-Fi network.

Stack: Vite, TypeScript and Svelte 5, no backend. See [AGENTS.md](AGENTS.md) for the architecture and conventions, and [docs/](docs) for the RTTTL and Nokia Composer specifications.

## License

[MIT](LICENSE)
