import { describe, expect, it } from 'vitest';
import {
  heldLevel,
  INSTRUMENT_IDS,
  INSTRUMENTS,
  isInstrumentId,
  pulseWaveCoefficients,
  type Envelope,
} from './instruments';

describe('instruments', () => {
  it.each(INSTRUMENT_IDS)('%s has partial levels summing to 1', (id) => {
    const sum = INSTRUMENTS[id].partials.reduce((s, p) => s + p.level, 0);
    expect(sum).toBeCloseTo(1);
  });

  it.each(INSTRUMENT_IDS)('%s has a valid envelope and MIDI program', (id) => {
    const { envelope, midiProgram } = INSTRUMENTS[id];
    expect(envelope.attack).toBeGreaterThan(0);
    expect(envelope.release).toBeGreaterThan(0);
    expect(envelope.sustain).toBeGreaterThanOrEqual(0);
    expect(envelope.sustain).toBeLessThanOrEqual(1);
    expect(midiProgram).toBeGreaterThanOrEqual(0);
    expect(midiProgram).toBeLessThan(128);
  });

  it('validates ids', () => {
    expect(isInstrumentId('flute')).toBe(true);
    expect(isInstrumentId('banjo')).toBe(false);
    expect(isInstrumentId(null)).toBe(false);
  });
});

describe('heldLevel', () => {
  const pluck: Envelope = {
    attack: 0.01,
    decay: 0.5,
    sustain: 0.2,
    release: 0.1,
  };
  const organ: Envelope = { attack: 0.01, decay: 0, sustain: 1, release: 0.1 };

  it('ramps up during the attack', () => {
    expect(heldLevel(pluck, 0)).toBe(0);
    expect(heldLevel(pluck, 0.005)).toBeCloseTo(0.5);
  });

  it('starts the decay at the peak', () => {
    expect(heldLevel(pluck, 0.01)).toBeCloseTo(1);
  });

  it('decays towards the sustain level', () => {
    expect(heldLevel(pluck, 0.26)).toBeLessThan(0.5);
    expect(heldLevel(pluck, 5)).toBeCloseTo(0.2);
  });

  it('holds the peak without decay', () => {
    expect(heldLevel(organ, 2)).toBe(1);
  });
});

describe('pulseWaveCoefficients', () => {
  it('has no DC offset and the requested size', () => {
    const { real, imag } = pulseWaveCoefficients(0.25, 16);
    expect(real).toHaveLength(17);
    expect(real[0]).toBe(0);
    expect(imag[0]).toBe(0);
  });

  it('has no even harmonics at 50 % duty (square wave)', () => {
    const { real, imag } = pulseWaveCoefficients(0.5, 8);
    expect(Math.hypot(real[2]!, imag[2]!)).toBeCloseTo(0);
    expect(Math.hypot(real[1]!, imag[1]!)).toBeGreaterThan(0.5);
  });
});
