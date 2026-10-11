import { describe, expect, it } from 'vitest';
import { setMajorBrand } from './compressed';

const ascii = (bytes: Uint8Array) => String.fromCharCode(...bytes);

describe('setMajorBrand', () => {
  it('rewrites the major brand of an ftyp box', () => {
    const bytes = new Uint8Array(
      [0, 0, 0, 24, ...'ftypisom'].map((c) =>
        typeof c === 'number' ? c : c.charCodeAt(0),
      ),
    );
    setMajorBrand(bytes, 'M4A ');
    expect(ascii(bytes.subarray(4, 12))).toBe('ftypM4A ');
  });

  it('leaves other data untouched', () => {
    const bytes = new Uint8Array([0, 0, 0, 8, 102, 114, 101, 101, 1, 2, 3, 4]);
    const copy = bytes.slice();
    setMajorBrand(bytes, 'M4A ');
    expect(bytes).toEqual(copy);
  });
});
