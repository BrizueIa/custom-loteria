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
