import { memo, useEffect, useMemo, useRef } from 'react';

/** Firefox has no native HLS, so hls.js is imported only when a live background is used. */
function BackgroundVideo({ url, filterStyle, loop, muted, hls, live, maxHeight }) {
  const videoRef = useRef(null);
  const storedMute = useMemo(() => localStorage.getItem('backgroundVideoMute') === 'true', []);
  const storedLoop = useMemo(() => localStorage.getItem('backgroundVideoLoop') === 'true', []);

  // Plays muted and looping: an unmuted video is blocked by autoplay rules,
  // which would leave a black background.
  const isMuted = muted ?? storedMute;
  const shouldLoop = loop ?? (live ? false : storedLoop);

  useEffect(() => {
    if (!hls || !url) return undefined;

    const video = videoRef.current;
    let player = null;
    let cancelled = false;

    (async () => {
      const { default: Hls } = await import('hls.js');
      if (cancelled || !video) return;

      if (!Hls.isSupported()) {
        video.src = url;
        return;
      }

      player = new Hls({
        // A blob worker would need the extension CSP widened; one stream does not need it.
        enableWorker: false,
        maxBufferLength: 10,
        backBufferLength: 5,
        // Webcam channels ship a DEFAULT=YES caption rendition (timestamp,
        // location); subtitles would be drawn over the clock, so both switches
        // are off and nothing renders either way.
        subtitleDisplay: false,
        renderTextTracksNatively: false,
      });

      player.loadSource(url);
      player.attachMedia(video);

      // Chosen explicitly: the player measures the element before layout, so
      // letting hls.js pick by element size lands on the 360p level.
      player.on(Hls.Events.MANIFEST_PARSED, () => {
        const limit = maxHeight || 1080;
        let best = -1;
        let bestHeight = 0;

        player.levels.forEach((level, index) => {
          const height = level.height || 0;
          if (height && height <= limit && height >= bestHeight) {
            best = index;
            bestHeight = height;
          }
        });

        if (best >= 0) player.currentLevel = best;
      });

      player.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) console.warn('Live background failed:', data.type, data.details);
      });

      // Renditions can arrive after start-up, so every track is disabled again
      // whenever the list changes.
      const silence = () => {
        if (!player) return;
        if (player.subtitleTrack !== -1) player.subtitleTrack = -1;
        for (const track of video.textTracks) track.mode = 'disabled';
      };

      player.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, silence);
      player.on(Hls.Events.MANIFEST_PARSED, silence);
    })();

    return () => {
      cancelled = true;
      if (player) player.destroy();
    };
  }, [url, hls]);

  // A live stream keeps downloading while the tab is hidden; park it instead.
  useEffect(() => {
    if (!live) return undefined;

    const onVisibility = () => {
      const video = videoRef.current;
      if (!video) return;

      if (document.hidden) video.pause();
      else video.play().catch(() => {});
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [live]);

  // An MP4 can carry a subtitle track and `<video>` will show it, so every
  // track is disabled on load and on each new one, whatever the source.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const disableTextTracks = () => {
      for (const track of video.textTracks) track.mode = 'disabled';
    };

    disableTextTracks();
    video.addEventListener('loadedmetadata', disableTextTracks);
    video.textTracks.addEventListener('addtrack', disableTextTracks);

    return () => {
      video.removeEventListener('loadedmetadata', disableTextTracks);
      video.textTracks.removeEventListener('addtrack', disableTextTracks);
    };
  }, [url, hls]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted={isMuted}
      loop={shouldLoop}
      playsInline
      style={filterStyle}
      id="backgroundVideo"
    >
      {!hls && <source src={url} />}
    </video>
  );
}

export default memo(BackgroundVideo);
