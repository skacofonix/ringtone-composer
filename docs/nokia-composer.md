# The Nokia "Composer" (3310 and its contemporaries)

**English** · [Français](nokia-composer.fr.md)

This document is the reference for the **retro mode**. Points marked **To be confirmed** should be checked, for example with a real 3310, an emulator or period videos, before being set in stone in the code.

## On-screen notation

Each note is written `<duration><#?><note><octave>`, separated by spaces:

```
4c1 8#d2 16g2 2- 4.a1
```

- duration: `1 2 4 8 16 32`;
- `.` after the duration: dotted note;
- `#`: sharp;
- note: `c d e f g a b`, or `-` for a rest;
- octave: `1`, `2` or `3`.

Mapping to RTTTL: **Nokia octave = RTTTL octave − 3**, so Nokia 1 = RTTTL 4. This is what the 2015 C# version did (`NokiaComposerConverter`, `OffsetScale = 3`), which accepted Nokia octaves 1 to 4. The position of the dot is inconsistent in the old code: the parser expected it before the octave (`8#f.2`), the export wrote it after (`8#f2.`). We accept both.

## T9 keypad

| Key                  | Action                                                      |
| -------------------- | ----------------------------------------------------------- |
| `1` to `7`           | insert `c d e f g a b` with the current duration and octave |
| `0`                  | insert a rest                                               |
| `8`                  | shorten the current note (4 → 8 → 16…)                      |
| `9`                  | lengthen the current note (4 → 2 → 1…)                      |
| `*`                  | raise the octave of the current note (1 → 2 → 3 → 1)        |
| `#`                  | add or remove the sharp of the current note                 |
| `C` / clear          | delete the note before the cursor                           |
| arrows (navi-roller) | move the cursor in the score                                |

**Dotted note:** obtained with a **long press** on the note key. The 2015 version wrote the long press with parentheses: `(5)`.

**To be confirmed:** the exact behavior of `*` at the end of the cycle (back to 1 or stuck), and the initial duration on a real 3310.

### Key sequences

Magazines of the time published ringtones as sequences of keys to type. The 2015 version (`NokiaKeypressConverter`) could read and write them, with these rules:

- initial state: duration 8, Nokia octave 1;
- for each note: the note key (in parentheses if dotted), then as many `8` or `9` as needed to reach the wanted duration from the previous one, then `#` if sharp, then as many `*` as needed to reach the wanted octave;
- the current duration and octave **carry over** from one note to the next;
- default tempo of the composer: 120 BPM.

Example: `5 9 (6) 8 #**`

The app reads and writes these sequences (menu **More → Nokia keys**, code in `src/core/keypress.ts`). Reading replays the keys on the same T9 state machine as the retro keypad. Writing produces the keys to type a melody on a real 3310; octaves out of the Composer range (RTTTL 7) are brought back to Nokia octave 3, and the app says so.

## The 3310 screen

- Monochrome LCD, **84 × 48 pixels**, dark pixels on a backlit green-grey background.
- The composer shows the score on a few lines, with a blinking cursor.
- Rendering in the app: a `<canvas>` paints an 84 × 48 image computed by `src/ui/retro/screen.ts`, with a home-made 5×7 bitmap font (`src/ui/retro/font.ts`).

## Composer menu ("Options")

On the phone, the Navi key shows "Options" at the bottom of the Composer screen and opens a menu drawn on the LCD: Play, Tempo, Send, Clear, Exit…

In the app (`src/ui/retro/menu.ts`, a pure state machine, drawn by `screen.ts`):

- a **short press** on the Navi key opens Options; a **long press** plays or stops (shortcut, not on the original);
- the scroll key moves in the list (it wraps around), the Navi key selects, `C` goes back, and a digit jumps to the item with that number;
- items: Play, Tempo, Instrument, Classics, Share, Ringtone, Clear all, Exit. Play, Share, Ringtone and Clear all are hidden while the melody is empty;
- **Tempo** steps through the tempo table of the Nokia Smart Messaging specification (25, 28, 31… 900 BPM), starting from the nearest value;
- **Instrument** plays a note of each instrument while scrolling;
- list screens show the item number at the top right (`2/8`), the selected item in reverse video and a scroll bar, as on the phone.

## Implementation choices (`src/core/nokia.ts`)

To be corrected if a real 3310 says otherwise:

- On-screen notation: duration, dot, sharp, note, octave, for example `8.#f2`. A rest is written `16-` or `2.-`.
- A new note takes the duration of the previous note and the octave of the last `Tone`. The very first note starts from `NOKIA_START` (duration 8, Nokia octave 1).
- `#` on `e` or `b`, or `*`/`#` on a rest: no effect.
- `*` after octave 3 goes back to 1. An imported octave out of range (RTTTL 7) also goes back to 1.
- Long press on `C`: clears everything, without confirmation (it can be undone).
- Computer keyboard: holding a key down acts as a long press, thanks to the keyboard auto-repeat.
