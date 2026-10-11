import { describe, expect, it } from 'vitest';
import { isApplePlatform } from './platform';

describe('isApplePlatform', () => {
  it.each([
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
  ])('recognizes Apple devices', (userAgent) => {
    expect(isApplePlatform(userAgent)).toBe(true);
  });

  it.each([
    'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edg/130.0',
    '',
  ])('treats others as non-Apple', (userAgent) => {
    expect(isApplePlatform(userAgent)).toBe(false);
  });
});
