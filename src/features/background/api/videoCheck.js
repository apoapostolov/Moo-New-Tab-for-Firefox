/** True for `data:video/` URLs and `.mp4`, `.webm` or `.ogg` filenames. */
export default function videoCheck(url) {
  return (
    typeof url === 'string' &&
    (/^(?:data:)?video\//i.test(url) || /\.(?:mp4|webm|ogg|ogv)(?:[?#].*)?$/i.test(url))
  );
}
