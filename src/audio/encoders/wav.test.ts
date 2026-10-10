import { describe, expect, it } from 'vitest';
import { encodeWav } from './wav';

const text = (bytes: Uint8Array, offset: number, length: number) =>
  String.fromCharCode(...bytes.slice(offset, offset + length));

describe('encodeWav', () => {
  const samples = new Float32Array([0, 1, -1, 0.5, 2, -3]);
  const bytes = encodeWav(samples, 8000);
  const view = new DataView(bytes.buffer);

  it('writes a RIFF/WAVE header', () => {
    expect(text(bytes, 0, 4)).toBe('RIFF');
    expect(text(bytes, 8, 4)).toBe('WAVE');
    expect(text(bytes, 12, 4)).toBe('fmt ');
    expect(text(bytes, 36, 4)).toBe('data');
    expect(view.getUint32(4, true)).toBe(bytes.length - 8);
  });

  it('declares 16-bit mono PCM', () => {
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(8000);
    expect(view.getUint32(28, true)).toBe(16000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true)).toBe(samples.length * 2);
  });

  it('converts and clamps samples', () => {
    const pcm = Array.from({ length: samples.length }, (_, i) =>
      view.getInt16(44 + i * 2, true),
    );
    expect(pcm).toEqual([0, 32767, -32768, 16384, 32767, -32768]);
  });
});
