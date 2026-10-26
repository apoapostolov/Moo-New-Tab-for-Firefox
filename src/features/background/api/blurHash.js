import { decodeBlurHash } from 'fast-blurhash';

/** Decodes into a width×height canvas and returns it as a data URL, or null on failure. */
export function generateBlurHashDataUrl(blurHash, width = 32, height = 32) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(width, height);
    imageData.data.set(decodeBlurHash(blurHash, width, height));
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  } catch (error) {
    console.error('Failed to generate blur hash:', error);
    return null;
  }
}
