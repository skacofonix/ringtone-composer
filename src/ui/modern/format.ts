/** How the modern mode writes notes: `F#5` and `1/8 •`. */
import type { Duration, Note } from '../../core/melody';

export function noteName(note: Note): string {
  return note.kind === 'tone'
    ? `${note.pitch.toUpperCase()}${note.octave}`
    : '—';
}

export function durationLabel(duration: Duration): string {
  return duration === 1 ? '1' : `1/${duration}`;
}

export function noteLength(note: Note): string {
  const value = durationLabel(note.duration);
  return note.dotted ? `${value} •` : value;
}
