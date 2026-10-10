/**
 * RTTTL (Ring Tone Text Transfer Language) reader and writer.
 * Format reference: docs/rtttl.md
 */
import {
  isDuration,
  PITCH_CLASSES,
  rest,
  tone,
  type Duration,
  type Melody,
  type Note,
  type PitchClass,
} from './melody';

/** Values used when the defaults section omits a key. */
export const RTTTL_DEFAULTS = { duration: 4, octave: 6, bpm: 63 } as const;

const MIN_OCTAVE = 3;
const MAX_OCTAVE = 8;

/** `[duration] [#] note [#] [.] [octave] [.]`, on a lowercased token without spaces. */
const NOTE_PATTERN = /^(\d+)?(#)?([a-hp])(#)?(\.)?(\d)?(\.)?$/;

export class RtttlParseError extends Error {
  /** Character offset in the parsed text where the problem was found. */
  readonly position: number;

  constructor(message: string, position: number) {
    super(`${message} (position ${position})`);
    this.name = 'RtttlParseError';
    this.position = position;
  }
}

interface Section {
  readonly text: string;
  /** Offset of `text` in the full RTTTL string. */
  readonly offset: number;
}

interface Defaults {
  duration: Duration;
  octave: number;
  bpm: number;
}

/**
 * Parses an RTTTL string. Lenient on real-world variants (case, spaces,
 * missing defaults, `#` before or after the note, dot before or after the
 * octave, `h` for `b`), strict on values that would produce a wrong melody.
 *
 * @throws {RtttlParseError} with the position of the faulty character.
 */
export function parseRtttl(text: string): Melody {
  const sections = splitWithOffsets(text, ':');
  if (sections.length < 2 || sections.length > 3) {
    throw new RtttlParseError(
      'Format attendu : « nom:d=4,o=6,b=63:notes »',
      sections.length > 3 ? sections[3]!.offset - 1 : text.length,
    );
  }

  const name = sections[0]!.text.trim();
  // The defaults section is optional: `name:notes` is accepted too.
  const defaults: Defaults =
    sections.length === 3 ? parseDefaults(sections[1]!) : { ...RTTTL_DEFAULTS };
  const notes = parseNotes(sections[sections.length - 1]!, defaults);

  return { name, bpm: defaults.bpm, notes };
}

/**
 * Writes a melody as RTTTL. The default duration and octave are the most
 * frequent ones, so that most notes can omit them.
 */
export function serializeRtttl(melody: Melody): string {
  const duration = mostFrequent(
    melody.notes.map((n) => n.duration),
    RTTTL_DEFAULTS.duration,
  );
  const octave = mostFrequent(
    melody.notes.flatMap((n) => (n.kind === 'tone' ? [n.octave] : [])),
    RTTTL_DEFAULTS.octave,
  );

  const notes = melody.notes.map((n) => {
    let s = n.duration === duration ? '' : String(n.duration);
    if (n.kind === 'tone') {
      s += n.pitch;
      if (n.octave !== octave) s += String(n.octave);
    } else {
      s += 'p';
    }
    if (n.dotted) s += '.';
    return s;
  });

  const name = melody.name.replace(/[:,]/g, '').trim();
  return `${name}:d=${duration},o=${octave},b=${melody.bpm}:${notes.join(',')}`;
}

function parseDefaults(section: Section): Defaults {
  const defaults: Defaults = { ...RTTTL_DEFAULTS };

  for (const entry of splitWithOffsets(section.text, ',')) {
    const raw = entry.text.trim();
    if (raw === '') continue;

    const position = section.offset + entry.offset + leadingSpaces(entry.text);
    const match = /^([a-z])\s*=\s*(\d+)$/i.exec(raw);
    if (!match) {
      throw new RtttlParseError(`Paramètre invalide « ${raw} »`, position);
    }

    const key = match[1]!.toLowerCase();
    const value = Number(match[2]);
    switch (key) {
      case 'd':
        if (!isDuration(value)) {
          throw new RtttlParseError(
            `Durée par défaut invalide : ${value}`,
            position,
          );
        }
        defaults.duration = value;
        break;
      case 'o':
        if (value < MIN_OCTAVE || value > MAX_OCTAVE) {
          throw new RtttlParseError(
            `Octave par défaut invalide : ${value}`,
            position,
          );
        }
        defaults.octave = value;
        break;
      case 'b':
        if (value <= 0) {
          throw new RtttlParseError(`Tempo invalide : ${value}`, position);
        }
        defaults.bpm = value;
        break;
      // Unknown keys (some tools add their own) are ignored.
    }
  }

  return defaults;
}

function parseNotes(section: Section, defaults: Defaults): Note[] {
  const notes: Note[] = [];

  for (const entry of splitWithOffsets(section.text, ',')) {
    const raw = entry.text.replace(/\s+/g, '').toLowerCase();
    if (raw === '') continue;

    const position = section.offset + entry.offset + leadingSpaces(entry.text);
    const match = NOTE_PATTERN.exec(raw);
    if (!match) {
      throw new RtttlParseError(`Note invalide « ${raw} »`, position);
    }

    const [
      ,
      durationText,
      sharpBefore,
      letter,
      sharpAfter,
      dotBefore,
      octaveText,
      dotAfter,
    ] = match;

    const duration =
      durationText === undefined ? defaults.duration : Number(durationText);
    if (!isDuration(duration)) {
      throw new RtttlParseError(`Durée invalide « ${raw} »`, position);
    }
    const dotted = dotBefore !== undefined || dotAfter !== undefined;

    if (letter === 'p') {
      if (sharpBefore || sharpAfter) {
        throw new RtttlParseError(
          `Un silence ne peut pas être dièse « ${raw} »`,
          position,
        );
      }
      notes.push(rest(duration, dotted));
      continue;
    }

    if (sharpBefore && sharpAfter) {
      throw new RtttlParseError(`Double dièse « ${raw} »`, position);
    }

    const octave =
      octaveText === undefined ? defaults.octave : Number(octaveText);
    if (octave < MIN_OCTAVE || octave > MAX_OCTAVE) {
      throw new RtttlParseError(`Octave invalide « ${raw} »`, position);
    }

    // `h` is the German name of `b`.
    const base = letter === 'h' ? 'b' : letter!;
    const pitch = `${base}${sharpBefore || sharpAfter ? '#' : ''}`;
    if (!isPitchClass(pitch)) {
      throw new RtttlParseError(
        `« ${pitch} » n'existe pas (pas de dièse sur e et b)`,
        position,
      );
    }

    notes.push(tone(pitch, octave, duration, dotted));
  }

  return notes;
}

function isPitchClass(value: string): value is PitchClass {
  return (PITCH_CLASSES as readonly string[]).includes(value);
}

function splitWithOffsets(text: string, separator: string): Section[] {
  const sections: Section[] = [];
  let offset = 0;
  for (const part of text.split(separator)) {
    sections.push({ text: part, offset });
    offset += part.length + separator.length;
  }
  return sections;
}

function leadingSpaces(text: string): number {
  return text.length - text.trimStart().length;
}

/** Most frequent value; on a tie, the one that appears first. */
function mostFrequent<T>(values: readonly T[], fallback: T): T {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);

  let best = fallback;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}
