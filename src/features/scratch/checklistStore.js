export const MAX_CHECKLIST_DEPTH = 3;
export const MAX_CHECKLIST_ITEMS = 500;

export function validChecklist(value) {
  return Boolean(
    value &&
    typeof value.title === 'string' &&
    value.title.length <= 200 &&
    Array.isArray(value.items) &&
    value.items.length <= MAX_CHECKLIST_ITEMS &&
    new Set(value.items.map((item) => item?.id)).size === value.items.length &&
    value.items.every(
      (item, index) =>
        item &&
        typeof item.id === 'string' &&
        item.id.length > 0 &&
        item.id.length <= 100 &&
        typeof item.text === 'string' &&
        item.text.length <= 2000 &&
        typeof item.completed === 'boolean' &&
        Number.isInteger(item.depth) &&
        item.depth >= 0 &&
        item.depth <= MAX_CHECKLIST_DEPTH &&
        item.depth <= (index ? value.items[index - 1].depth + 1 : 0),
    ),
  );
}

export const newChecklistItem = (text = '', depth = 0, completed = false) => ({
  id: crypto.randomUUID(),
  text,
  depth,
  completed,
});

export function checklistFromNote(text, title = '') {
  const lines = String(text || '').split(/\r?\n/);
  if (!title && /^#{1,6}\s+/.test(lines[0] || '')) title = lines.shift().replace(/^#{1,6}\s+/, '');
  const items = [];
  for (const line of lines.filter((line) => line.trim())) {
    const match = line.match(/^(\s*)(?:[-*+]\s+(?:\[([ xX])\]\s*)?|\d+[.)]\s+)?(.*)$/);
    const depth = Math.min(
      MAX_CHECKLIST_DEPTH,
      Math.floor(match[1].replaceAll('\t', '  ').length / 2),
      items.length ? items.at(-1).depth + 1 : 0,
    );
    items.push(newChecklistItem(match[3], depth, match[2]?.toLowerCase() === 'x'));
  }
  return { title, items };
}

export function checklistMarkdown(value) {
  const body = value.items
    .map((item) => `${'  '.repeat(item.depth)}- [${item.completed ? 'x' : ' '}] ${item.text}`)
    .join('\n');
  return value.title.trim() ? `# ${value.title}\n\n${body}` : body;
}

export function checklistProgress(items) {
  const entries = items.filter((item) => item.text.trim());
  const done = entries.filter((item) => item.completed).length;
  return { done, total: entries.length, fraction: entries.length ? done / entries.length : 0 };
}

export function branchEnd(items, index) {
  let end = index + 1;
  while (end < items.length && items[end].depth > items[index].depth) end++;
  return end;
}

export function setChecklistCompleted(items, id, completed) {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return items;
  const end = branchEnd(items, index);
  const result = items.map((item, position) =>
    position >= index && position < end ? { ...item, completed } : item,
  );
  let ancestorDepth = items[index].depth;
  if (!completed) {
    for (let before = index - 1; before >= 0 && ancestorDepth > 0; before--) {
      if (result[before].depth < ancestorDepth) {
        ancestorDepth = result[before].depth;
        result[before] = { ...result[before], completed: false };
      }
    }
  }
  return result;
}

export function removeChecklistItem(items, id) {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return items;
  const end = branchEnd(items, index);
  return items
    .filter((item) => item.id !== id)
    .map((item, position) =>
      position >= index && position < end - 1 ? { ...item, depth: item.depth - 1 } : item,
    );
}

export function indentChecklistItem(items, id, direction) {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0 || !direction) return items;
  const end = branchEnd(items, index);
  const branch = items.slice(index, end);
  const depth = items[index].depth;
  if (direction > 0) {
    if (Math.max(...branch.map((item) => item.depth)) >= MAX_CHECKLIST_DEPTH) return items;
    let sibling = index - 1;
    while (sibling >= 0 && items[sibling].depth > depth) sibling--;
    if (sibling < 0 || items[sibling].depth !== depth) return items;
    return items.map((item, position) =>
      position >= index && position < end ? { ...item, depth: item.depth + 1 } : item,
    );
  }
  if (!depth) return items;
  let parent = index - 1;
  while (parent >= 0 && items[parent].depth >= depth) parent--;
  const insertAt = branchEnd(items, parent) - branch.length;
  const remaining = items.filter((_, position) => position < index || position >= end);
  remaining.splice(insertAt, 0, ...branch.map((item) => ({ ...item, depth: item.depth - 1 })));
  return remaining;
}

export function moveChecklistItem(items, id, overId, horizontal = 0) {
  const index = items.findIndex((item) => item.id === id);
  const overIndex = items.findIndex((item) => item.id === overId);
  if (index < 0 || overIndex < 0) return items;
  if (id === overId) return indentChecklistItem(items, id, Math.sign(horizontal));
  const end = branchEnd(items, index);
  if (overIndex >= index && overIndex < end) return items;
  const branch = items.slice(index, end);
  const remaining = items.filter((_, position) => position < index || position >= end);
  const target = remaining.findIndex((item) => item.id === overId);
  const insertAt = index < overIndex ? branchEnd(remaining, target) : target;
  const maxRelative = Math.max(...branch.map((item) => item.depth - items[index].depth));
  const min = remaining[insertAt]?.depth || 0;
  const max = Math.min(
    MAX_CHECKLIST_DEPTH - maxRelative,
    insertAt ? remaining[insertAt - 1].depth + 1 : 0,
  );
  if (min > max) return items;
  const depth = Math.max(min, Math.min(max, remaining[target].depth + horizontal));
  remaining.splice(
    insertAt,
    0,
    ...branch.map((item) => ({ ...item, depth: item.depth - items[index].depth + depth })),
  );
  return remaining;
}

export function compactChecklistItems(items) {
  let result = items;
  for (const item of items.filter((item) => !item.text.trim())) {
    result = removeChecklistItem(result, item.id);
  }
  return result.map((item) => ({ ...item, text: item.text.trim() }));
}
