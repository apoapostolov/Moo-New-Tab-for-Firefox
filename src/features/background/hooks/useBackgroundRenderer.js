import { useEffect, useRef, useMemo } from 'react';
import { createBlobUrl } from '../api/blobUrl';
import { generateBlurHashDataUrl } from '../api/blurHash';
import { getBackgroundFilterStyle, getBackgroundOverlayStyle } from '../api/backgroundFilters';

const TRANSITION_DURATION = 1200; // milliseconds

export function useBackgroundRenderer(backgroundData) {
  const blobRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (backgroundData.video) return;

    const element = document.getElementById('backgroundImage');
    if (!element) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const applyBackground = async () => {
      if (backgroundData.url) {
        const hasTransition = localStorage.getItem('bgtransition') !== 'false';
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!hasTransition || prefersReducedMotion) {
          element.style.background = `url(${backgroundData.url})`;
          document.querySelector('.photoInformation')?.style.setProperty('display', 'flex');
          return;
        }

        // The crossfade needs a second element, so the main one never blanks.
        let overlay = document.getElementById('backgroundOverlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = 'backgroundOverlay';
          element.parentNode.insertBefore(overlay, element.nextSibling);
        }

        if (backgroundData.photoInfo?.colour) {
          element.style.backgroundColor = backgroundData.photoInfo.colour;
        }

        // Tiny placeholder drawn at once, before the full image arrives.
        if (backgroundData.photoInfo?.blur_hash) {
          const blurHashUrl = generateBlurHashDataUrl(backgroundData.photoInfo.blur_hash, 64, 64);
          if (blurHashUrl) {
            element.style.backgroundImage = `url(${blurHashUrl})`;
          }
        }

        const blobUrl = await createBlobUrl(backgroundData.url);
        const finalUrl = blobUrl || backgroundData.url;

        if (blobUrl) {
          if (blobRef.current) {
            URL.revokeObjectURL(blobRef.current);
          }
          blobRef.current = blobUrl;
        }

        // Wait for load so the fade starts with the image ready.
        const img = new Image();
        img.src = finalUrl;

        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });

        // Order matters: go transparent without a transition, set the image,
        // restore the transition, then raise opacity. Each step needs its own
        // forced reflow or the browser coalesces the changes and nothing animates.
        overlay.style.transition = 'none';
        overlay.style.opacity = '0';
        overlay.style.backgroundImage = '';

        void overlay.offsetHeight;

        overlay.style.backgroundImage = `url(${finalUrl})`;

        void overlay.offsetHeight;

        overlay.style.transition = `opacity ${TRANSITION_DURATION / 1000}s ease-in-out`;

        void overlay.offsetHeight;

        overlay.style.opacity = '1';

        // The main element takes over once the fade ends, so the overlay can clear.
        setTimeout(() => {
          element.style.backgroundImage = `url(${finalUrl})`;
          overlay.style.opacity = '0';
          overlay.style.backgroundImage = '';
        }, TRANSITION_DURATION + 100);
      } else if (backgroundData.style) {
        element.setAttribute('style', backgroundData.style);
      }
    };

    applyBackground();

    return () => {
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const overlay = document.getElementById('backgroundOverlay');
      if (overlay) {
        overlay.remove();
      }
    };
  }, [backgroundData.url, backgroundData.style, backgroundData.video, backgroundData.photoInfo]);
}

/** Legacy `filter` styles: a video cannot carry a backdrop-filter overlay. */
export function useBackgroundFilters() {
  return useMemo(() => ({ WebkitFilter: getBackgroundFilterStyle() }), []);
}

export function useBackgroundOverlayFilters() {
  return useMemo(() => getBackgroundOverlayStyle(), []);
}
