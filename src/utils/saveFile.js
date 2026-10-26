/**
 * Saves `data` as a download; objects are serialised as indented JSON.
 */
export function saveFile(data, filename = 'file', type = 'text/json') {
  if (typeof data === 'object') {
    data = JSON.stringify(data, undefined, 4);
  }

  const blob = new Blob([data], { type });

  const a = document.createElement('a');

  a.href = window.URL.createObjectURL(blob);
  a.download = filename;
  a.dataset.downloadurl = [type, a.download, a.href].join(':');

  document.body.append(a);
  a.click();
  a.remove();
  // Let the browser start the download before releasing the blob.
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
