import { encode } from 'blurhash';

/**
 * Dimensions of a data URL or File.
 */
export async function getImageDimensions(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
      // Object URLs leak unless revoked.
      if (typeof source !== 'string') {
        URL.revokeObjectURL(img.src);
      }
    };

    img.onerror = () => {
      if (typeof source !== 'string') URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
}

/**
 * BlurHash for a data URL or File.
 */
export async function generateBlurHash(source, componentX = 4, componentY = 3) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        // Encoding cost grows with pixel count, so cap the sampled size.
        const maxSize = 64;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = Math.max(1, Math.floor(img.width * scale));
        canvas.height = Math.max(1, Math.floor(img.height * scale));

        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        const blurHash = encode(
          imageData.data,
          imageData.width,
          imageData.height,
          componentX,
          componentY,
        );

        resolve(blurHash);
      } catch (error) {
        reject(error);
      } finally {
        if (typeof source !== 'string') URL.revokeObjectURL(img.src);
      }
    };

    img.onerror = () => {
      if (typeof source !== 'string') URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image for blur hash'));
    };
    img.crossOrigin = 'anonymous';

    if (typeof source === 'string') {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
}

/**
 * Byte size of a base64 data URL.
 */
export function getDataUrlSize(dataUrl) {
  const base64String = dataUrl.split(',')[1];
  if (!base64String) {
    return 0;
  }

  // 4 characters encode 3 bytes; `=` padding is not data.
  const padding = (base64String.match(/=/g) || []).length;
  return Math.floor((base64String.length * 3) / 4 - padding);
}

/**
 * The file's own name, or `Image <n>` using a 1-based index.
 */
export function getFileName(file, index) {
  if (file && file.name) {
    return file.name;
  }
  return `Image ${index + 1}`;
}

/**
 * Always 0: backgrounds live in IndexedDB, so callers measure them from the
 * stored rows instead.
 */
export function calculateStorageSize() {
  return 0; // Will be calculated from actual backgrounds in the component
}

/**
 * Bytes used by every localStorage key, measured as UTF-8.
 */
export function calculateTotalStorageSize() {
  const settings = {};
  Object.keys(localStorage).forEach((key) => {
    settings[key] = localStorage.getItem(key);
  });
  return new TextEncoder().encode(JSON.stringify(settings)).length;
}

/**
 * Bytes as a readable string such as `2.3 MB`, counting 1024 bytes to the unit.
 */
export function formatBytes(bytes) {
  if (bytes === 0) {
    return '0 Bytes';
  }
  if (!bytes) {
    return 'Unknown';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
}
