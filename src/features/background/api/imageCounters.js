import variables from 'config/variables';

const HEARTED_KEY = 'heartedImages';
const HEARTED_LIMIT = 50;

const readHearted = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(HEARTED_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** Only library images have counters; Unsplash photos are proxied live and answer 404. */
export function canRecordCounter(photoInfo) {
  return Boolean(photoInfo?.id) && photoInfo?.api === 'mue';
}

/** kind is 'view', 'download' or 'heart'; null means the image has no counters. */
export async function recordImageCounter(photoInfo, kind) {
  if (!canRecordCounter(photoInfo)) {
    return null;
  }

  try {
    const response = await fetch(
      `${variables.constants.API_URL}/images/${encodeURIComponent(photoInfo.id)}/${kind}`,
      { method: 'POST', headers: { accept: 'application/json' } },
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Toggling favourite off and on again is not a new heart, so counted ids are
 * remembered locally.
 */
export async function recordHeartOnce(photoInfo) {
  if (!canRecordCounter(photoInfo)) {
    return null;
  }

  const hearted = readHearted();
  if (hearted.includes(photoInfo.id)) {
    return null;
  }

  const result = await recordImageCounter(photoInfo, 'heart');
  if (result) {
    const updated = [...hearted, photoInfo.id].slice(-HEARTED_LIMIT);
    localStorage.setItem(HEARTED_KEY, JSON.stringify(updated));
  }

  return result;
}
