# Changelog

All notable changes to RingtoneComposer are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-10-11

First version of the rewrite, as an installable web app (the 2015 C# version lives at <https://github.com/skacofonix/RingtoneComposer>).

### Added

- **Retro mode**: a Nokia 3310 with a pixel-accurate 84×48 LCD and a T9 keypad reproducing the original Composer (notes 1–7, rest 0, long press for dotted notes, 8 / 9 for length, `*` for octave, `#` for sharp, C to delete).
- **Modern mode**: two-octave piano, score with an insertion cursor, length and dotted-note picker, and a bar to edit the current note (length, dot, sharp, octave).
- **Undo and redo**, in both modes (header buttons, Ctrl+Z / Ctrl+Y).
- **RTTTL** import and export, tolerant of real-world variants, with translated error messages.
- **Nokia key sequences**: the keys to type a melody on a real 3310, and import of sequences published in magazines.
- **Six synthesized instruments**: Nokia buzzer, 8-bit console, flute, organ, music box, electric piano.
- **Catalog** of 14 public-domain classics, playable before loading.
- **Share by link**: the melody and the instrument travel in the URL, no server involved.
- **Ringtone export** as a WAV file, with step-by-step guides for Android and iPhone (GarageBand), and **MIDI export**.
- **Autosave** of the current melody in the browser.
- **English and French** interface, following the browser language by default.
- **Light and dark themes**, following the system by default.
- Installable **PWA** that works offline, deployed on GitHub Pages.

[Unreleased]: https://github.com/skacofonix/ringtone-composer/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/skacofonix/ringtone-composer/releases/tag/v1.0.0
