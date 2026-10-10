/**
 * Standard MIDI File (format 0) writer: opens in GarageBand, MuseScore or
 * any music software, where the melody can be played with any instrument.
 */
import { midiNumber, type Melody, type Note } from './melody';

/** Ticks per quarter note. */
export const TICKS_PER_QUARTER = 480;

const CHANNEL = 0;
const VELOCITY = 100;

/** Variable-length quantity, the MIDI encoding of delta times. */
export function encodeVlq(value: number): number[] {
  const bytes = [value & 0x7f];
  let rest = value >>> 7;
  while (rest > 0) {
    bytes.unshift((rest & 0x7f) | 0x80);
    rest >>>= 7;
  }
  return bytes;
}

export function noteTicks(note: Note): number {
  const ticks = (TICKS_PER_QUARTER * 4) / note.duration;
  return Math.round(note.dotted ? ticks * 1.5 : ticks);
}

/**
 * Encodes a melody as a single-track MIDI file.
 * @param program General MIDI program (0-127) suggested for the track.
 */
export function encodeMidi(
  melody: Melody,
  program: number,
): Uint8Array<ArrayBuffer> {
  const track: number[] = [];
  const event = (delta: number, ...bytes: number[]) =>
    track.push(...encodeVlq(delta), ...bytes);
  const meta = (type: number, data: number[]) =>
    event(0, 0xff, type, ...encodeVlq(data.length), ...data);

  meta(0x03, [...new TextEncoder().encode(melody.name)]); // track name
  const microsPerQuarter = Math.round(60_000_000 / melody.bpm);
  meta(0x51, [
    (microsPerQuarter >> 16) & 0xff,
    (microsPerQuarter >> 8) & 0xff,
    microsPerQuarter & 0xff,
  ]);
  meta(0x58, [4, 2, 24, 8]); // 4/4
  event(0, 0xc0 | CHANNEL, program & 0x7f);

  let pending = 0; // Rests only move time forward.
  for (const note of melody.notes) {
    const ticks = noteTicks(note);
    if (note.kind === 'rest') {
      pending += ticks;
      continue;
    }
    const key = Math.min(127, Math.max(0, midiNumber(note)));
    event(pending, 0x90 | CHANNEL, key, VELOCITY);
    event(ticks, 0x80 | CHANNEL, key, 0);
    pending = 0;
  }
  event(pending, 0xff, 0x2f, 0x00); // end of track

  const header = [
    ...ascii('MThd'),
    ...uint32(6),
    ...uint16(0), // format 0: a single track
    ...uint16(1),
    ...uint16(TICKS_PER_QUARTER),
  ];
  return new Uint8Array([
    ...header,
    ...ascii('MTrk'),
    ...uint32(track.length),
    ...track,
  ]);
}

function ascii(text: string): number[] {
  return [...text].map((c) => c.charCodeAt(0));
}

function uint16(value: number): number[] {
  return [(value >> 8) & 0xff, value & 0xff];
}

function uint32(value: number): number[] {
  return [
    (value >>> 24) & 0xff,
    (value >> 16) & 0xff,
    (value >> 8) & 0xff,
    value & 0xff,
  ];
}
