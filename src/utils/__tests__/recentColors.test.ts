import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeHexColor,
  getStoredRecentColors,
  saveRecentColor,
  clearStoredRecentColors,
} from '../recentColors';

describe('recentColors utility', () => {
  beforeEach(() => {
    clearStoredRecentColors();
  });

  it('normalizes 3-digit and 6-digit hex colors to uppercase #RRGGBB', () => {
    expect(normalizeHexColor('#fff')).toBe('#FFFFFF');
    expect(normalizeHexColor('141413')).toBe('#141413');
    expect(normalizeHexColor('#fd8fb2')).toBe('#FD8FB2');
    expect(normalizeHexColor('invalid')).toBeNull();
    expect(normalizeHexColor('')).toBeNull();
  });

  it('stores and retrieves recent colors with MRU ordering and no duplicates', () => {
    expect(getStoredRecentColors()).toEqual([]);

    saveRecentColor('#FF0000');
    saveRecentColor('#00FF00');
    saveRecentColor('#0000FF');

    let stored = getStoredRecentColors();
    expect(stored).toEqual(['#0000FF', '#00FF00', '#FF0000']);

    // Re-adding #FF0000 should move it to the front
    saveRecentColor('#FF0000');
    stored = getStoredRecentColors();
    expect(stored).toEqual(['#FF0000', '#0000FF', '#00FF00']);
  });

  it('caps recent colors at a maximum of 8 items', () => {
    const colors = [
      '#111111', '#222222', '#333333', '#444444',
      '#555555', '#666666', '#777777', '#888888',
      '#999999', '#AAAAAA'
    ];
    for (const c of colors) {
      saveRecentColor(c);
    }
    const stored = getStoredRecentColors();
    expect(stored.length).toBe(8);
    // The most recently added #AAAAAA should be at the front
    expect(stored[0]).toBe('#AAAAAA');
  });

  it('clears stored recent colors cleanly', () => {
    saveRecentColor('#123456');
    expect(getStoredRecentColors().length).toBe(1);
    clearStoredRecentColors();
    expect(getStoredRecentColors()).toEqual([]);
  });
});
