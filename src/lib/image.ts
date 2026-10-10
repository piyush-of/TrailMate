/**
 * Downscales a photo to a small JPEG data URL. Camera photos are 3-8 MB; CLIP only needs ~224px,
 * and storing full-size photos in IndexedDB would bloat storage and slow every live query.
 */
export async function fileToSmallDataUrl(file: Blob, maxSize = 512, quality = 0.8): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not available');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', quality);
}
