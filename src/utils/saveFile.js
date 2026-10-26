/**
 * Saves `data` as a download; objects are serialised as indented JSON.
 */
export function saveFile(data, filename = 'file', type = 'text/json') {
  if (typeof data === 'object') {
    data = JSON.stringify(data, undefined, 4);
  }

  const blob = new Blob([data], { type });

  const event = document.createEvent('MouseEvents');
  const a = document.createElement('a');

  a.href = window.URL.createObjectURL(blob);
  a.download = filename;
  a.dataset.downloadurl = [type, a.download, a.href].join(':');

  // Deprecated API: every one of these positional arguments is required.
  event.initMouseEvent(
    'click',
    true,
    false,
    window,
    0,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    false,
    0,
    null,
  );
  a.dispatchEvent(event);
}
