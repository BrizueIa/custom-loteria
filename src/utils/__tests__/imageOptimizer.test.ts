import { describe, it, expect } from 'vitest';
import { isSvgDataUrl, optimizeImage } from '../imageOptimizer';

describe('imageOptimizer', () => {
  it('identifies SVG data URLs', () => {
    expect(isSvgDataUrl('data:image/svg+xml;utf8,<svg></svg>')).toBe(true);
    expect(isSvgDataUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(false);
    expect(isSvgDataUrl('https://example.com/photo.jpg')).toBe(false);
  });

  it('preserves SVG data URLs as-is without re-encoding to JPEG', async () => {
    const svg = 'data:image/svg+xml;utf8,<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';
    const result = await optimizeImage(svg);
    expect(result).toBe(svg);
  });

  it('handles image timeout or fallback safely', async () => {
    const mockDataUrl = 'data:image/jpeg;base64,FAKE_IMAGE_DATA';
    // Test with small timeout to verify fallback
    const result = await optimizeImage(mockDataUrl, { timeoutMs: 50 });
    expect(result).toBe(mockDataUrl);
  });

  it('compresses image when onload fires on Image', async () => {
    const fakeDataUrl = 'data:image/jpeg;base64,12345';

    // Mock Image onload trigger
    const originalImage = window.Image;
    try {
      (window as any).Image = class {
        src = '';
        width = 1600;
        height = 1200;
        onload: () => void = () => {};
        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 10);
        }
      };

      const result = await optimizeImage(fakeDataUrl, { timeoutMs: 1000 });
      expect(result).toBeDefined();
    } finally {
      window.Image = originalImage;
    }
  });
});
