/**
 * Image optimization utility to compress and resize user-uploaded photos
 * Ensures 54 cards comfortably fit inside browser localStorage (~5MB limit)
 * and generate lightweight JSON exports and swift PDF rendering without quality loss.
 */

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  timeoutMs?: number;
}

export function isSvgDataUrl(dataUrl: string): boolean {
  return typeof dataUrl === 'string' && dataUrl.startsWith('data:image/svg+xml');
}

/**
 * Resizes and compresses an image (File or Data URL) to a high-density JPEG.
 * Defaults to max 800x1000 bounding box at 82% JPEG quality (~35-65 KB per card).
 */
export async function optimizeImage(
  source: File | string,
  options: ResizeOptions = {}
): Promise<string> {
  const { maxWidth = 800, maxHeight = 1000, quality = 0.82, timeoutMs = 2500 } = options;

  // If source is already an SVG data URL, keep vector precision intact
  if (typeof source === 'string' && isSvgDataUrl(source)) {
    return source;
  }

  // Get data URL from File if needed
  let initialUrl = '';
  if (typeof source === 'string') {
    initialUrl = source;
  } else {
    // If it's an SVG file, read as text/svg data URL
    if (source.type === 'image/svg+xml') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = reject;
        reader.readAsDataURL(source);
      });
    }

    initialUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = reject;
      reader.readAsDataURL(source);
    });
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return initialUrl;
  }

  return new Promise((resolve) => {
    let finished = false;
    const finish = (res: string) => {
      if (finished) return;
      finished = true;
      if (timer) clearTimeout(timer);
      resolve(res);
    };

    const timer = setTimeout(() => {
      finish(initialUrl);
    }, timeoutMs);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const naturalWidth = img.naturalWidth || img.width || 1;
      const naturalHeight = img.naturalHeight || img.height || 1;

      // Calculate scale ratio
      let targetWidth = naturalWidth;
      let targetHeight = naturalHeight;

      if (targetWidth > maxWidth || targetHeight > maxHeight) {
        const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
        targetWidth = Math.round(targetWidth * ratio);
        targetHeight = Math.round(targetHeight * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        finish(initialUrl);
        return;
      }

      // Fill white background in case of transparent PNGs converting to JPEG
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Draw resized image with smooth bilinear scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      try {
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        finish(compressedDataUrl);
      } catch (e) {
        finish(initialUrl);
      }
    };

    img.onerror = () => {
      // Fallback to original URL on load failure
      finish(initialUrl);
    };

    img.src = initialUrl;
  });
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

/**
 * Returns crisp dark or white text color depending on background luminance
 */
export function getContrastingTextColor(bgHex?: string, preferredColor?: string): string {
  if (!bgHex || !bgHex.startsWith('#')) {
    return preferredColor || '#141413';
  }
  let clean = bgHex.replace('#', '');
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return preferredColor || '#141413';

  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  // Perceived luminance
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  if (luminance < 0.38) {
    return '#FFFFFF';
  }
  return '#141413';
}

/**
 * Automatically extracts the dominant background color along the outer edges of an image.
 * Uses quantized color histogram along the 4 edges so central objects or small watermarks do not skew the result.
 */
export async function extractBackgroundColorFromImage(imageSrc: string): Promise<string> {
  if (!imageSrc || typeof window === 'undefined' || typeof document === 'undefined') {
    return '#FFFFFF';
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve('#FFFFFF'), 1500);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('#FFFFFF');
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);

        const { data } = ctx.getImageData(0, 0, size, size);
        const buckets = new Map<string, { count: number; rSum: number; gSum: number; bSum: number }>();

        const addPixel = (x: number, y: number) => {
          const idx = (y * size + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          // Quantize into 8-level steps to group subtle watercolor/JPEG variations together
          const qr = Math.round(r / 8) * 8;
          const qg = Math.round(g / 8) * 8;
          const qb = Math.round(b / 8) * 8;
          const key = `${qr},${qg},${qb}`;
          const prev = buckets.get(key) || { count: 0, rSum: 0, gSum: 0, bSum: 0 };
          prev.count += 1;
          prev.rSum += r;
          prev.gSum += g;
          prev.bSum += b;
          buckets.set(key, prev);
        };

        // Sample 2px inset along all 4 perimeter edges
        for (let i = 2; i < size - 2; i++) {
          addPixel(i, 2);
          addPixel(i, 3);
          addPixel(i, size - 3);
          addPixel(i, size - 4);
          addPixel(2, i);
          addPixel(3, i);
          addPixel(size - 3, i);
          addPixel(size - 4, i);
        }

        let best = { count: 0, rSum: 255, gSum: 255, bSum: 255 };
        for (const entry of buckets.values()) {
          if (entry.count > best.count) {
            best = entry;
          }
        }

        if (best.count === 0) {
          resolve('#FFFFFF');
          return;
        }

        resolve(rgbToHex(best.rSum / best.count, best.gSum / best.count, best.bSum / best.count));
      } catch {
        resolve('#FFFFFF');
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve('#FFFFFF');
    };

    img.src = imageSrc;
  });
}

/**
 * Samples the average color around normalized coordinates (relX, relY in 0..1) of an image for the interactive Eyedropper tool.
 */
export async function samplePixelColor(
  imageSrc: string,
  relX: number,
  relY: number
): Promise<string | null> {
  if (!imageSrc || typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve(null), 1500);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const w = img.naturalWidth || img.width || 200;
        const h = img.naturalHeight || img.height || 200;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const cx = Math.max(0, Math.min(w - 1, Math.round(relX * w)));
        const cy = Math.max(0, Math.min(h - 1, Math.round(relY * h)));
        const radius = 2; // 5x5 pixel window average for smooth sampling

        const x0 = Math.max(0, cx - radius);
        const y0 = Math.max(0, cy - radius);
        const sw = Math.min(w - x0, radius * 2 + 1);
        const sh = Math.min(h - y0, radius * 2 + 1);

        const { data } = ctx.getImageData(x0, y0, sw, sh);
        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        const total = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
          rSum += data[i];
          gSum += data[i + 1];
          bSum += data[i + 2];
        }

        if (total === 0) {
          resolve(null);
          return;
        }

        resolve(rgbToHex(rSum / total, gSum / total, bSum / total));
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };

    img.src = imageSrc;
  });
}
