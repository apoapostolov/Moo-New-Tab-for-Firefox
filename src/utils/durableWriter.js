export function durableWriter(write, onStatus = () => {}, delay = 250) {
  let latest;
  let timer;
  let dirty = false;
  const flush = () => {
    clearTimeout(timer);
    if (!dirty) return true;
    try {
      write(latest);
      dirty = false;
      onStatus('Saved');
      return true;
    } catch {
      onStatus('Not saved: storage is full. Save a backup or free some space, then try again.');
      return false;
    }
  };
  return {
    schedule(value) {
      latest = value;
      dirty = true;
      clearTimeout(timer);
      onStatus('Saving…');
      timer = setTimeout(flush, delay);
    },
    flush,
    value: () => latest,
  };
}

const drafts = new Map();
export function registerDraft(key, writer) {
  drafts.set(key, writer);
  return () => {
    if (drafts.get(key) === writer) drafts.delete(key);
  };
}
export function flushDrafts() {
  for (const writer of drafts.values())
    if (!writer.flush())
      throw new Error(
        'Some notes could not be saved. Free some space before replacing this profile.',
      );
}
export function pendingDrafts() {
  return Object.fromEntries(
    [...drafts].flatMap(([key, writer]) =>
      writer.value() === undefined ? [] : [[key, JSON.stringify(writer.value())]],
    ),
  );
}
