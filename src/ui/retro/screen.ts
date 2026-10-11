/**
 * The 84×48 monochrome LCD of the 3310, as a plain pixel buffer (1 = dark
 * pixel). Pure functions: the Lcd component only paints the result.
 */
import type { Melody } from '../../core/melody';
import { formatNokiaNote } from '../../core/nokia';
import { advance, glyph, GLYPH_HEIGHT, textWidth } from './font';

export const LCD_WIDTH = 84;
export const LCD_HEIGHT = 48;

export type Frame = Uint8Array;

export function createFrame(): Frame {
  return new Uint8Array(LCD_WIDTH * LCD_HEIGHT);
}

export function setPixel(frame: Frame, x: number, y: number, on = 1): void {
  if (x < 0 || y < 0 || x >= LCD_WIDTH || y >= LCD_HEIGHT) return;
  frame[y * LCD_WIDTH + x] = on;
}

export function fillRect(
  frame: Frame,
  x: number,
  y: number,
  width: number,
  height: number,
  on = 1,
): void {
  for (let j = y; j < y + height; j++) {
    for (let i = x; i < x + width; i++) setPixel(frame, i, j, on);
  }
}

/** Draws text with its top-left corner at (x, y). Returns the x after it. */
export function drawText(
  frame: Frame,
  x: number,
  y: number,
  text: string,
  on = 1,
  scale = 1,
): number {
  for (const char of text) {
    const { rows, left, width } = glyph(char);
    rows.forEach((row, j) => {
      for (let i = 0; i < width; i++) {
        if (row & (0x10 >> (left + i))) {
          fillRect(frame, x + i * scale, y + j * scale, scale, scale, on);
        }
      }
    });
    x += advance(char) * scale;
  }
  return x;
}

/** Cuts a text so that it fits in `maxWidth` pixels. */
export function fitText(text: string, maxWidth: number): string {
  let result = text;
  while (result.length > 0 && textWidth(result) > maxWidth) {
    result = result.slice(0, -1);
  }
  return result;
}

export interface ComposerScreen {
  readonly melody: Melody;
  readonly cursor: number;
  /** Index of the note being played, -1 when idle. */
  readonly playingIndex: number;
  readonly playing: boolean;
  /** Blink phase of the cursor. */
  readonly cursorVisible: boolean;
  /** Texts drawn on the screen, in the interface language. */
  readonly labels: { options: string; stop: string; untitled: string };
}

/* Layout, in pixels. */
const MARGIN = 1;
const HEADER_LINE_Y = 8;
const SCORE_TOP = 11;
const LINE_HEIGHT = 9;
const SCORE_LINES = 3;
const NOTE_GAP = 4;
const SOFT_KEY_Y = LCD_HEIGHT - GLYPH_HEIGHT;

interface Token {
  readonly text: string;
  readonly line: number;
  readonly x: number;
  readonly width: number;
}

/**
 * Lays out notes in lines, like words in a paragraph. Returns one token per
 * note and the x positions of the cursor slots (`slots[i]` is before note i).
 */
export function layoutScore(melody: Melody): {
  tokens: Token[];
  slots: { line: number; x: number }[];
} {
  const tokens: Token[] = [];
  const slots: { line: number; x: number }[] = [];
  const maxX = LCD_WIDTH - MARGIN;
  let line = 0;
  let x = MARGIN + 1;

  for (const note of melody.notes) {
    const text = formatNokiaNote(note);
    const width = textWidth(text);
    if (x + width > maxX && x > MARGIN + 1) {
      line++;
      x = MARGIN + 1;
    }
    slots.push({ line, x: x - 2 });
    tokens.push({ text, line, x, width });
    x += width + NOTE_GAP;
  }
  slots.push({ line, x: x - 2 });
  return { tokens, slots };
}

/** The Composer screen: title and tempo, the score, and the soft key label. */
export function renderComposer(screen: ComposerScreen): Frame {
  const frame = createFrame();
  const { melody, cursor, playingIndex, playing, cursorVisible, labels } =
    screen;

  // Header: name on the left, tempo on the right, then a rule.
  const tempo = `♪${melody.bpm}`;
  const tempoWidth = textWidth(tempo);
  drawText(frame, LCD_WIDTH - tempoWidth, 0, tempo);
  const nameWidth = LCD_WIDTH - tempoWidth - 4;
  drawText(frame, 0, 0, fitText(melody.name || labels.untitled, nameWidth));
  fillRect(frame, 0, HEADER_LINE_Y, LCD_WIDTH, 1);

  // Score: scroll so that the followed position stays visible.
  const { tokens, slots } = layoutScore(melody);
  const followedLine =
    playing && playingIndex >= 0
      ? (tokens[playingIndex]?.line ?? 0)
      : (slots[cursor]?.line ?? 0);
  const firstLine = Math.max(0, followedLine - (SCORE_LINES - 1));
  const lineY = (line: number) => SCORE_TOP + (line - firstLine) * LINE_HEIGHT;
  const visible = (line: number) =>
    line >= firstLine && line < firstLine + SCORE_LINES;

  tokens.forEach((token, i) => {
    if (!visible(token.line)) return;
    const y = lineY(token.line);
    if (i === playingIndex) {
      fillRect(frame, token.x - 1, y - 1, token.width + 2, GLYPH_HEIGHT + 2);
      drawText(frame, token.x, y, token.text, 0);
    } else {
      drawText(frame, token.x, y, token.text);
    }
  });

  const slot = slots[cursor];
  if (!playing && cursorVisible && slot && visible(slot.line)) {
    fillRect(frame, slot.x, lineY(slot.line) - 1, 1, GLYPH_HEIGHT + 2);
  }

  // Scroll hints, on the right edge.
  if (firstLine > 0) setPixel(frame, LCD_WIDTH - 1, SCORE_TOP - 1);
  const lastLine = tokens.at(-1)?.line ?? 0;
  if (lastLine >= firstLine + SCORE_LINES) {
    setPixel(frame, LCD_WIDTH - 1, SOFT_KEY_Y - 3);
  }

  // Soft key label, centered at the bottom (the Navi key opens Options).
  const label = playing ? labels.stop : labels.options;
  drawText(
    frame,
    Math.round((LCD_WIDTH - textWidth(label)) / 2),
    SOFT_KEY_Y,
    label,
  );

  return frame;
}

/* ---------- Menu screens ---------- */

export interface ListScreen {
  readonly title: string;
  readonly items: readonly string[];
  readonly index: number;
  /** Label of the Navi key, at the bottom. */
  readonly softKey: string;
}

export interface ValueScreen {
  readonly title: string;
  /** Drawn twice as large, centered. */
  readonly value: string;
  /** Small text under the value (a unit). */
  readonly caption: string;
  readonly softKey: string;
}

const LIST_LINES = 3;

/** Title on the left, extra text (item number…) on the right, then a rule. */
function drawHeader(frame: Frame, title: string, right = ''): void {
  const rightWidth = textWidth(right);
  if (right) drawText(frame, LCD_WIDTH - rightWidth, 0, right);
  drawText(frame, 0, 0, fitText(title, LCD_WIDTH - rightWidth - 4));
  fillRect(frame, 0, HEADER_LINE_Y, LCD_WIDTH, 1);
}

function drawSoftKey(frame: Frame, label: string): void {
  const x = Math.round((LCD_WIDTH - textWidth(label)) / 2);
  drawText(frame, x, SOFT_KEY_Y, label);
}

/**
 * A Nokia menu list: the selected item in reverse video, its number at the
 * top right, and a scroll bar on the right edge.
 */
export function renderList(screen: ListScreen): Frame {
  const frame = createFrame();
  const { title, items, index, softKey } = screen;
  drawHeader(frame, title, `${index + 1}/${items.length}`);

  // Keep the selection on the middle line when possible.
  const first = Math.max(0, Math.min(index - 1, items.length - LIST_LINES));
  const textWidthMax = LCD_WIDTH - 6;
  items.slice(first, first + LIST_LINES).forEach((item, line) => {
    const y = SCORE_TOP + line * LINE_HEIGHT;
    const text = fitText(item, textWidthMax);
    if (first + line === index) {
      fillRect(frame, 0, y - 1, LCD_WIDTH - 3, GLYPH_HEIGHT + 2);
      drawText(frame, 2, y, text, 0);
    } else {
      drawText(frame, 2, y, text);
    }
  });

  // Scroll bar: a dotted track with a solid thumb.
  const top = SCORE_TOP - 1;
  const height = LIST_LINES * LINE_HEIGHT;
  for (let y = top; y < top + height; y += 2) setPixel(frame, LCD_WIDTH - 1, y);
  const thumb = Math.max(3, Math.round(height / items.length));
  const thumbY =
    top +
    Math.round(((height - thumb) * index) / Math.max(1, items.length - 1));
  fillRect(frame, LCD_WIDTH - 2, thumbY, 2, thumb);

  drawSoftKey(frame, softKey);
  return frame;
}

/** A value to adjust with the scroll key (the tempo), shown large. */
export function renderValue(screen: ValueScreen): Frame {
  const frame = createFrame();
  drawHeader(frame, screen.title);

  const scale = 2;
  const valueWidth = textWidth(screen.value) * scale;
  const y = SCORE_TOP;
  drawText(
    frame,
    Math.round((LCD_WIDTH - valueWidth) / 2),
    y,
    screen.value,
    1,
    scale,
  );
  // Arrows on both sides: the scroll key changes the value.
  drawText(frame, 4, y + 4, '‹');
  drawText(frame, LCD_WIDTH - 4 - textWidth('›'), y + 4, '›');
  const captionWidth = textWidth(screen.caption);
  drawText(
    frame,
    Math.round((LCD_WIDTH - captionWidth) / 2),
    y + GLYPH_HEIGHT * scale + 2,
    screen.caption,
  );

  drawSoftKey(frame, screen.softKey);
  return frame;
}
