import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Loads a fresh haptics module with a fake navigator and storage. */
async function load(vibrate?: (pattern: number) => boolean) {
  const data = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  });
  vi.stubGlobal('navigator', vibrate ? { vibrate } : {});
  vi.resetModules();
  const module = await import('./haptics.svelte');
  return { ...module, data };
}

describe('haptics', () => {
  let vibrate: ReturnType<typeof vi.fn<(pattern: number) => boolean>>;

  beforeEach(() => {
    vibrate = vi.fn<(pattern: number) => boolean>(() => true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('vibrates briefly on a tap, longer on a long press', async () => {
    const { haptics, PATTERNS } = await load(vibrate);
    haptics.play('tap');
    haptics.play('long');
    expect(vibrate.mock.calls).toEqual([[PATTERNS.tap], [PATTERNS.long]]);
    expect(PATTERNS.long).toBeGreaterThan(PATTERNS.tap);
  });

  it('is on by default and can be turned off, remembering the choice', async () => {
    const { haptics, data } = await load(vibrate);
    expect(haptics.enabled).toBe(true);
    haptics.setEnabled(false);
    haptics.play('tap');
    expect(vibrate).not.toHaveBeenCalled();
    expect(data.get('ringtone-composer:haptics')).toBe('off');
  });

  it('confirms with a vibration when turned on', async () => {
    const { haptics } = await load(vibrate);
    haptics.setEnabled(false);
    haptics.setEnabled(true);
    expect(vibrate).toHaveBeenCalledTimes(1);
  });

  it('does nothing without any haptic method', async () => {
    const { haptics } = await load();
    expect(haptics.supported).toBe(false);
    expect(() => haptics.play('tap')).not.toThrow();
  });

  it('ignores a browser that throws', async () => {
    const { haptics } = await load(() => {
      throw new Error('blocked');
    });
    expect(() => haptics.play('long')).not.toThrow();
  });
});

describe('haptics on iPhone (switch input technique)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  /** Fake DOM: counts the clicks on the hidden switch labels. */
  async function loadIphone(maxTouchPoints = 5) {
    const clicks: string[] = [];
    class FakeInput {
      type = '';
      attributes = new Map<string, string>();
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      }
    }
    Object.defineProperty(FakeInput.prototype, 'switch', { value: false });
    vi.stubGlobal('HTMLInputElement', FakeInput);
    vi.stubGlobal('document', {
      createElement: (tag: string) =>
        tag === 'input'
          ? new FakeInput()
          : {
              style: {},
              append: () => undefined,
              click: () => clicks.push('tick'),
              remove: () => undefined,
            },
      head: { append: () => undefined },
    });
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} });
    vi.stubGlobal('navigator', { maxTouchPoints });
    vi.resetModules();
    const { haptics } = await import('./haptics.svelte');
    return { haptics, clicks };
  }

  it('ticks once on a tap, twice on a long press', async () => {
    vi.useFakeTimers();
    const { haptics, clicks } = await loadIphone();
    expect(haptics.supported).toBe(true);
    haptics.play('tap');
    expect(clicks).toHaveLength(1);
    haptics.play('long');
    vi.runAllTimers();
    expect(clicks).toHaveLength(3);
  });

  it('is unavailable without a touch screen (Safari on a Mac)', async () => {
    const { haptics } = await loadIphone(0);
    expect(haptics.supported).toBe(false);
  });
});
