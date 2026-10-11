# Security policy

## Supported versions

RingtoneComposer is a web app deployed continuously from the `main` branch to <https://skacofonix.github.io/ringtone-composer/>. Only this deployed version is supported: fixes are not backported.

## Scope

The app runs entirely in the browser. It has no backend, no account and no server-side storage: melodies are saved in the browser's local storage and shared through the URL fragment, which is never sent to a server.

Relevant reports include, for example: script injection through a shared link or an imported RTTTL text, a malicious file produced by the WAV or MIDI export, or a vulnerable dependency shipped in the app.

## Reporting a vulnerability

Please **do not open a public issue**. Report it privately through GitHub:
[Report a vulnerability](https://github.com/skacofonix/ringtone-composer/security/advisories/new).

Include a description, the steps to reproduce (a shared link or RTTTL text is ideal) and the affected browser. You should receive a first answer within a week. Once the issue is fixed and deployed, it can be disclosed publicly, with credit if you wish.
