/** Fetches a remote URL into a blob URL; null means the caller keeps the direct URL. */
export async function createBlobUrl(url, signal) {
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}
