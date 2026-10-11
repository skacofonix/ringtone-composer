# RTTTL format

**English** · [Français](rtttl.fr.md)

**RTTTL** (_Ring Tone Text Transfer Language_) is the text format created by Nokia to describe monophonic ringtones.

## Structure

Three sections separated by `:`.

```
<name>:<defaults>:<notes>
Tetris:d=4,o=5,b=160:e6,8b,8c6,8d6,16e6,16d6,8c6,8b,a,8a,8c6,e6,8d6,8c6,b,8b,8c6,d6,e6,c6,a,2a
```

### 1. Name

The title of the ringtone. Historically limited to 10 characters; longer names are accepted when reading and may be truncated on export.

### 2. Defaults

A comma-separated list of `key=value`. Every key is optional.

| Key | Meaning                              | Values                                       | Default if missing |
| --- | ------------------------------------ | -------------------------------------------- | ------------------ |
| `d` | default duration                     | 1, 2, 4, 8, 16, 32 (1 = whole, 4 = quarter…) | 4                  |
| `o` | default octave                       | 4 to 7 (3 to 8 tolerated)                    | 6                  |
| `b` | tempo in BPM (quarter notes per min) | 25 to 900 in the original specification      | 63                 |

### 3. Notes

A comma-separated list of notes:

```
[duration] note [#] [.] [octave] [.]
```

- `duration`: optional, otherwise `d`.
- `note`: `c d e f g a b`, or `p` for a rest (_pause_). Some files use `h` for `b` (German notation).
- `#`: sharp. The valid sharps are `c# d# f# g# a#`.
- `.`: dotted note (length × 1.5). Depending on the source, the dot comes before or after the octave: both must be accepted.
- `octave`: optional, otherwise `o`.

## Computations

- Length of a note in ms: `(60000 / b) * (4 / duration)`, × 1.5 if dotted.
- Frequency: `440 * 2^((n - 69) / 12)` where `n` is the MIDI note number. Here the RTTTL octave is assumed to follow scientific pitch notation (`a4` = 440 Hz). **To be confirmed** with real files: some implementations are one octave apart. The 2015 C# version used `a4` = 880 Hz. This choice lives in a single constant, `RTTTL_OCTAVE_SHIFT` in `src/core/melody.ts`.

## Rules for our parser

- Case insensitive; ignore spaces and line breaks.
- Accept `name:notes` without a defaults section, and a sharp before the note (`#f`): two variants the 2015 version handled.
- Tolerate missing or partial defaults.
- Report errors with the position of the faulty character, rather than silently ignoring them.
- Canonical serialization: pick the most frequent `d` and `o` to minimize the size, and check that `serialize(parse(x))` gives an equivalent melody.
