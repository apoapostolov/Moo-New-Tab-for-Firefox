/** Match the Google previews: beside the card, centred in the viewport. */
export function sidePreviewPosition(card, height, preferredWidth, viewport) {
  const width = Math.min(preferredWidth, Math.max(0, viewport.width - 48));
  const besideRight = card.left + card.width / 2 < viewport.width / 2;
  const wantedLeft = besideRight ? card.right + 12 : card.left - width - 12;
  const maxHeight = Math.max(0, Math.min(viewport.height * 0.62, viewport.height - 32));
  return {
    position: 'fixed',
    width,
    maxHeight,
    left: Math.max(16, Math.min(wantedLeft, viewport.width - width - 16)),
    top: Math.max(16, (viewport.height - Math.min(height, maxHeight)) / 2),
    visibility: height ? 'visible' : 'hidden',
  };
}
