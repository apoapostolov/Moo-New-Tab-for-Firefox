/** True for `data:video/` URLs and `.mp4`, `.webm` or `.ogg` filenames. */
export default function videoCheck(url) {
  return (
    url.startsWith('data:video/') ||
    url.endsWith('.mp4') ||
    url.endsWith('.webm') ||
    url.endsWith('.ogg')
  );
}
