import { describe, expect, it } from 'vitest';
import { tone, type Melody } from '../../core/melody';
import { advance, glyph, textWidth } from './font';
import {
  createFrame,
  drawText,
  fitText,
  layoutScore,
  LCD_HEIGHT,
  LCD_WIDTH,
  renderComposer,
} from './screen';

/** ASCII view of a frame region, handy to debug: `#` = dark pixel. */
function ascii(frame: Uint8Array, width: number, height: number): string[] {
  return Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) =>
      frame[y * LCD_WIDTH + x] ? '#' : '.',
    ).join(''),
  );
}

describe('font', () => {
  it('has 7 rows of 5 bits per glyph', () => {
    for (const char of '0123456789ABCZabcz#-.♪') {
      const { rows } = glyph(char);
      expect(rows).toHaveLength(7);
      for (const row of rows) expect(row).toBeLessThan(32);
    }
  });

  it('is proportional', () => {
    expect(glyph('.').width).toBe(1);
    expect(glyph('1').width).toBe(3);
    expect(glyph('8').width).toBe(5);
    expect(textWidth('8.#f2')).toBe(5 + 1 + 1 + 1 + 5 + 1 + 5 + 1 + 5);
  });

  it('drops accents and replaces unknown characters', () => {
    expect(glyph('é')).toEqual(glyph('e'));
    expect(glyph('€')).toEqual(glyph('?'));
    expect(advance(' ')).toBe(3);
  });
});

describe('drawing', () => {
  it('draws a glyph pixel by pixel', () => {
    const frame = createFrame();
    const end = drawText(frame, 0, 0, '1');
    expect(ascii(frame, 4, 7)).toEqual([
      '.#..',
      '##..',
      '.#..',
      '.#..',
      '.#..',
      '.#..',
      '###.',
    ]);
    expect(end).toBe(4);
  });

  it('clips outside the screen', () => {
    const frame = createFrame();
    expect(() => drawText(frame, 80, 45, 'WWW')).not.toThrow();
    expect(frame.length).toBe(LCD_WIDTH * LCD_HEIGHT);
  });

  it('fits text in a width', () => {
    expect(
      textWidth(fitText('Une sonnerie au nom très long', 40)),
    ).toBeLessThanOrEqual(40);
    expect(fitText('ok', 40)).toBe('ok');
  });
});

describe('composer screen', () => {
  const melody = (count: number): Melody => ({
    name: 'Test',
    bpm: 120,
    notes: Array.from({ length: count }, () => tone('c', 4, 8)),
  });

  it('wraps notes on several lines', () => {
    const { tokens, slots } = layoutScore(melody(30));
    expect(tokens[0]!.line).toBe(0);
    expect(tokens.at(-1)!.line).toBeGreaterThan(2);
    for (const t of tokens)
      expect(t.x + t.width).toBeLessThanOrEqual(LCD_WIDTH);
    expect(slots).toHaveLength(31);
  });

  it('renders without errors at every cursor position', () => {
    const m = melody(30);
    for (let cursor = 0; cursor <= 30; cursor++) {
      const frame = renderComposer({
        melody: m,
        cursor,
        playingIndex: -1,
        playing: false,
        cursorVisible: true,
      });
      expect(frame.some((p) => p === 1)).toBe(true);
    }
  });

  it('inverts the note being played', () => {
    const frame = renderComposer({
      melody: melody(1),
      cursor: 1,
      playingIndex: 0,
      playing: true,
      cursorVisible: true,
    });
    const { tokens } = layoutScore(melody(1));
    const t = tokens[0]!;
    // The pixel just left of the note is dark (inverted background).
    expect(frame[11 * LCD_WIDTH + t.x - 1]).toBe(1);
  });
});
