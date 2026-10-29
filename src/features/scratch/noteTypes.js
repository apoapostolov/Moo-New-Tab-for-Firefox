import { validCountdown } from '../countdown/countdownStore';
import { checklistMarkdown, validChecklist } from './checklistStore';

const TYPES = ['note', 'countdown', 'checklist'];

export function noteType(note) {
  if (note.type === 'note') return 'note';
  if (note.type === 'countdown' && validCountdown(note.countdown)) return 'countdown';
  if (note.type === 'checklist' && validChecklist(note.checklist)) return 'checklist';
  if (note.type !== undefined) return 'note';
  if (validCountdown(note.countdown)) return 'countdown';
  if (validChecklist(note.checklist)) return 'checklist';
  return 'note';
}

export function validNoteMemories(note) {
  return Boolean(
    note &&
    (note.type === undefined || TYPES.includes(note.type)) &&
    (note.countdown === undefined ||
      (validCountdown(note.countdown) &&
        (note.countdown.text === undefined || typeof note.countdown.text === 'string'))) &&
    (note.checklist === undefined || validChecklist(note.checklist)) &&
    (note.type !== 'countdown' || validCountdown(note.countdown)) &&
    (note.type !== 'checklist' || validChecklist(note.checklist)),
  );
}

/** Older countdowns stored their Markdown in the note's text field. Copy it before either version changes. */
export function normalizeNoteMemories(note) {
  return {
    ...note,
    type: noteType(note),
    text: typeof note.text === 'string' ? note.text : '',
    ...(validCountdown(note.countdown)
      ? {
          countdown: { ...note.countdown, text: note.countdown.text ?? note.text ?? '' },
        }
      : {}),
  };
}

export function noteBody(note) {
  if (noteType(note) === 'countdown') return note.countdown.text ?? note.text ?? '';
  if (noteType(note) === 'checklist') return checklistMarkdown(note.checklist);
  return note.text || '';
}

export function rememberNoteType(note, type, value) {
  const saved = normalizeNoteMemories(note);
  if (!TYPES.includes(type)) return saved;
  return { ...saved, type, ...(type === 'note' ? {} : { [type]: value }) };
}

export function switchNoteType(note, type) {
  const saved = normalizeNoteMemories(note);
  if (
    type === 'note' ||
    (type === 'countdown' && validCountdown(saved.countdown)) ||
    (type === 'checklist' && validChecklist(saved.checklist))
  )
    return { ...saved, type };
  return saved;
}

export function updateNoteBody(note, text) {
  const saved = normalizeNoteMemories(note);
  return saved.type === 'countdown'
    ? { ...saved, countdown: { ...saved.countdown, text } }
    : { ...saved, text };
}
