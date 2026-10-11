# Contributing to RingtoneComposer

Thanks for your interest! Bug reports, ideas, ringtone transcriptions and pull requests are all welcome.

By taking part in this project, you agree to follow its [Code of Conduct](CODE_OF_CONDUCT.md).

## Reporting a bug or suggesting an idea

Open an [issue](https://github.com/skacofonix/ringtone-composer/issues/new/choose) and pick the matching form. For a bug, the most useful details are the phone or browser, the mode (retro or modern) and, if possible, the RTTTL text of the melody (menu **More → RTTTL text**).

Security problems must **not** be reported in a public issue: see [SECURITY.md](SECURITY.md).

## Development setup

Requirements: Node.js (version in `.nvmrc`) and npm.

```bash
npm install
npm run dev        # http://localhost:5173
npm run verify     # format, lint, types, tests and build, as in CI
```

Use `npm run dev -- --host` to open the app from a phone on the same Wi-Fi network. The app is designed for phones first: check your changes at a width of about 375 px.

## Making a change

1. Read [AGENTS.md](AGENTS.md): it describes the architecture and the conventions. The most important ones:
   - all non-visual logic goes into `src/core/`, as pure functions with unit tests;
   - no text hard-coded in components: add it to `src/i18n/fr.ts` **and** `src/i18n/en.ts`;
   - colors only through the theme tokens of `src/app.css`;
   - no new dependency without a clear reason.
2. Create a branch from `main`, make your change and add tests where it makes sense.
3. Run `npm run verify`: it must pass.
4. Write short commit messages in English, in the imperative mood (`Add RTTTL parser`).
5. Open a pull request and fill in the template. The CI runs the same checks.

## Adding a ringtone to the catalog

The catalog (`src/catalog/classics.ts`) only accepts **public-domain** music: classical works, traditional and folk songs. Film, TV and video game themes are still under copyright and cannot be added. Give the title and origin in English and French; a test checks that the RTTTL is valid and shorter than 30 seconds.

## Documentation

Documentation is written in English, with a French version next to it (`README.fr.md`, `docs/*.fr.md`). If you change one, update the other, or mention it in your pull request so that someone can.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
