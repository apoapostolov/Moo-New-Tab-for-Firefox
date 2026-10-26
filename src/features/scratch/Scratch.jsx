import { durableWriter, registerDraft } from 'utils/durableWriter';
import { saveFile } from 'utils/saveFile';
import { withProfileLock } from 'utils/settings/profile';
import { readScratchAssets, patchScratchAssets } from 'utils/customBackgroundDB';
import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { useCallback, useEffect, useRef, useState } from 'react';

import EventBus from 'utils/eventbus';
import Markdown from './Markdown';
import {
  NOTE_WIDTH,
  TILT_EASE,
  MOVE_THRESHOLD,
  IMAGE_MAX_EDGE,
  IMAGE_QUALITY,
  IMAGE_MIN_WIDTH,
  IMAGE_MAX_WIDTH,
  clamp,
  settleAngle,
  randomTilt,
  dragTarget,
} from './shared';

import './scratchNotes.scss';
import './scratchImages.scss';

/**
 * A double click drops a note, a paste drops a picture. Both share one layer so overlapping items
 * agree on stacking order.
 */

const NOTES_STORE = 'scratchNotesData';
const NOTES_FLAG = 'scratchNotes';
const IMAGES_FLAG = 'scratchImages';
// Off by default: the lean is part of the feel. Turning it on keeps everything straight.
const NO_TILT_FLAG = 'scratchNoTilt';
// Off by default too: the pane of glass is what makes a note a note. Turned on, a note at
// rest is bare text on the wallpaper and takes its frame back when it is clicked, the way a
// picture with a cut-out already behaves.
const BARE_FLAG = 'scratchNotesBare';
const TOP_Z = 'scratchTopZ';
const ARM_TIMEOUT = 4000;
const NOT_BACKGROUND =
  '.scratchNote, .scratchImage, .scratchSaveError, #widgets, #navbar, .navbar, .modal, dialog, .ReactModal__Overlay, label, button, a, input, textarea, select, [contenteditable="true"], [role="button"], .Toastify, .reminder-info';

const TYPING = 'input, textarea, [contenteditable="true"], [contenteditable=""], [role="textbox"]';

const nextZ = () => {
  const top = Number(localStorage.getItem(TOP_Z) || 0) + 1;

  localStorage.setItem(TOP_Z, String(top));

  return top;
};

const readNotes = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(NOTES_STORE) || '[]');

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((note) => note && typeof note === 'object' && Number.isFinite(note.x))
      .map((note) => ({
        id: String(note.id || `n${Math.random().toString(36).slice(2)}`),
        x: note.x,
        y: Number.isFinite(note.y) ? note.y : 40,
        text: typeof note.text === 'string' ? note.text : '',
        angle: Number.isFinite(note.angle) ? note.angle : 1.5,
        z: Number.isFinite(note.z) ? note.z : 1,
      }));
  } catch {
    return [];
  }
};

const saveNotes = (notes) => localStorage.setItem(NOTES_STORE, JSON.stringify(notes));

const loadImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('That image could not be read.'));
    image.src = url;
  });

/** True when any pixel is not fully opaque, so the picture has a cut-out. */
const hasTransparency = (context, width, height) => {
  const { data } = context.getImageData(0, 0, width, height);

  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 250) return true;
  }

  return false;
};

/** Pictures stored before the sticker rule carry no flag yet: read the pixels once. */
const detectTransparency = async (src) => {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');

  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext('2d');

  context.drawImage(image, 0, 0);

  return hasTransparency(context, canvas.width, canvas.height);
};

/**
 * A clipboard screenshot can be several megabytes, so it is drawn once into a
 * smaller canvas and stored as WebP, keeping it in the hundreds of kilobytes.
 * The same pass reports whether the picture has any transparency.
 */
const prepareImage = async (file) => {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, IMAGE_MAX_EDGE / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');

    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext('2d');

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return {
      src: canvas.toDataURL('image/webp', IMAGE_QUALITY),
      ratio: image.width / Math.max(1, image.height),
      transparent: hasTransparency(context, canvas.width, canvas.height),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

// Firefox only accepts PNG on the clipboard, so a stored WebP is re-encoded first.
const toPngBlob = async (src) => {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');

  canvas.width = image.width;
  canvas.height = image.height;
  canvas.getContext('2d').drawImage(image, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('no blob'))), 'image/png');
  });
};

// Match the widget fade before staggering the scratch layer entrance.
const WIDGET_FADE = 1000;
const SCRATCH_ENTRANCE = WIDGET_FADE + 120; // a beat after the page settles
const SCRATCH_STAGGER = 60; // between one note and the next
const SCRATCH_WINDOW = 1600; // how long after arriving the entrance still counts

const Scratch = () => {
  useTranslationVersion();
  const [notesOn, setNotesOn] = useState(() => localStorage.getItem(NOTES_FLAG) === 'true');
  const [imagesOn, setImagesOn] = useState(() => localStorage.getItem(IMAGES_FLAG) === 'true');
  const [noTilt, setNoTilt] = useState(() => localStorage.getItem(NO_TILT_FLAG) === 'true');
  const [bare, setBare] = useState(() => localStorage.getItem(BARE_FLAG) === 'true');
  const [notesProblem] = useState(() => {
    try {
      const value = JSON.parse(localStorage.getItem(NOTES_STORE) || '[]');
      return !Array.isArray(value) || value.some((note) => !note || !Number.isFinite(note.x))
        ? 'Some saved notes could not be read. Their original data has been kept.'
        : '';
    } catch {
      return 'Some saved notes could not be read. Their original data has been kept.';
    }
  });
  const [notes, setNotesState] = useState(readNotes);
  const [images, setImages] = useState([]);
  const [saveError, setSaveError] = useState('');
  const [imageError, setImageError] = useState('');
  const imagesRef = useRef([]);
  const imageWrites = useRef(Promise.resolve());
  const notesRef = useRef(notes);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    readScratchAssets()
      .then((value) => {
        if (mounted.current) {
          imagesRef.current = value;
          setImages(value);
        }
      })
      .catch((error) => setImageError(error.message));
    return () => {
      mounted.current = false;
    };
  }, []);
  const [noteWriter] = useState(() => {
    const revision = localStorage.getItem('profileRevision');
    return durableWriter(
      (notes) => {
        if (notesProblem) throw new Error(notesProblem);
        if (revision !== localStorage.getItem('profileRevision'))
          throw new Error('The profile changed in another tab. Reload to continue.');
        saveNotes(notes);
      },
      (status) => setSaveError(status === 'Saved' || status === 'Saving…' ? '' : status),
    );
  });
  const setNotes = useCallback(
    (update) => {
      const next = typeof update === 'function' ? update(notesRef.current) : update;
      notesRef.current = next;
      noteWriter.schedule(next);
      setNotesState(next);
    },
    [noteWriter],
  );
  useEffect(() => {
    const unregister = registerDraft(NOTES_STORE, noteWriter);
    const flush = () => noteWriter.flush();
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', flush);
      flush();
      unregister();
    };
  }, [noteWriter]);
  const [editingId, setEditingId] = useState(null);
  const [armedId, setArmedId] = useState(null);
  const [drag, setDrag] = useState(null);
  const [imageDrag, setImageDrag] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [copyFailed, setCopyFailed] = useState(null);
  // The one note or picture in hand. Its controls are the only ones on screen.
  const [focused, setFocused] = useState(null);

  const dragRef = useRef(null);
  const imageDragRef = useRef(null);
  const tiltRef = useRef(0);
  const disarmTimer = useRef(null);
  const copyTimer = useRef(null);
  const inputs = useRef({});
  // Last pointer position; a paste with no pointer over the page falls back to the window centre.
  const pointer = useRef(null);

  // The entrance belongs to the layer arriving on the page, not to every note ever written:
  // a note made at noon appears at once. Each item's delay is decided the first time it is
  // seen and then kept, because re-deciding it on a later render would restart an animation
  // that is already running.
  const shown = notesOn || imagesOn;
  const shownBefore = useRef(shown);
  const enteredAt = useRef(performance.now());
  const delays = useRef(new Map());

  if (shown !== shownBefore.current) {
    shownBefore.current = shown;

    if (shown) {
      enteredAt.current = performance.now();
      delays.current.clear();
    }
  }

  const entrance = (id, step) => {
    if (!delays.current.has(id)) {
      const arriving = performance.now() - enteredAt.current < SCRATCH_WINDOW;

      delays.current.set(
        id,
        arriving ? `${SCRATCH_ENTRANCE + Math.min(step, 9) * SCRATCH_STAGGER}ms` : '0ms',
      );
    }

    return delays.current.get(id);
  };

  useEffect(() => {
    const reread = () => {
      setNotesOn(localStorage.getItem(NOTES_FLAG) === 'true');
      setImagesOn(localStorage.getItem(IMAGES_FLAG) === 'true');
      setNoTilt(localStorage.getItem(NO_TILT_FLAG) === 'true');
      setBare(localStorage.getItem(BARE_FLAG) === 'true');
    };

    EventBus.on('refresh', reread);
    EventBus.on('toggle', reread);

    return () => {
      EventBus.off('refresh', reread);
      EventBus.off('toggle', reread);
    };
  }, []);

  const commitNotes = setNotes;
  const commitImages = useCallback((update) => {
    const revision = localStorage.getItem('profileRevision');
    const write = async () => {
      if (revision !== localStorage.getItem('profileRevision')) return;
      const previous = imagesRef.current;
      const next = typeof update === 'function' ? update(previous) : update;
      const removed = previous
        .filter((image) => !next.some((item) => item.id === image.id))
        .map((image) => image.id);
      const upserts = next.filter(
        (image) =>
          JSON.stringify(previous.find((item) => item.id === image.id)) !== JSON.stringify(image),
      );
      try {
        const saved = await patchScratchAssets({ upserts, removed });
        imagesRef.current = saved;
        if (mounted.current) {
          setImages(saved);
          setImageError('');
        }
      } catch (error) {
        if (mounted.current)
          setImageError(
            `The picture change was not saved. Remove pictures you no longer need, or save a backup. ${error.message}`,
          );
      }
    };
    imageWrites.current = imageWrites.current.then(
      () => withProfileLock(write),
      () => withProfileLock(write),
    );
    return imageWrites.current;
  }, []);
  const lift = useCallback(
    (id, kind) => {
      const z = nextZ();
      if (kind === 'image') {
        commitImages((current) =>
          current.map((image) => (image.id === id ? { ...image, z } : image)),
        );
        return;
      }
      setNotes((current) => current.map((note) => (note.id === id ? { ...note, z } : note)));
    },
    [commitImages, setNotes],
  );

  // Notes

  const createNote = useCallback(
    (clientX, clientY) => {
      const note = {
        id: `n${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        x: clamp(clientX - 28, 8, Math.max(8, window.innerWidth - NOTE_WIDTH - 8)),
        y: clamp(clientY - 16, 8, Math.max(8, window.innerHeight - 120)),
        text: '',
        angle: noTilt ? 0 : randomTilt(),
        z: nextZ(),
      };

      commitNotes([...notes, note]);
      setEditingId(note.id);
      setFocused(note.id);
    },
    [commitNotes, notes, noTilt],
  );

  useEffect(() => {
    if (!notesOn || notesProblem) return undefined;

    const onDoubleClick = (event) => {
      if (event.target.closest?.(NOT_BACKGROUND)) return;
      if (document.querySelector('dialog[open], .ReactModal__Overlay--after-open')) return;

      createNote(event.clientX, event.clientY);
    };

    document.addEventListener('dblclick', onDoubleClick);

    return () => document.removeEventListener('dblclick', onDoubleClick);
  }, [createNote, notesOn, notesProblem]);

  const startDrag = (event, note) => {
    if (event.button !== 0) return;
    if (event.target.closest('.scratchNoteClose')) return;
    if (editingId === note.id) return;

    event.currentTarget.setPointerCapture?.(event.pointerId);

    tiltRef.current = 0;
    setFocused(note.id);

    dragRef.current = {
      id: note.id,
      startX: event.clientX,
      startY: event.clientY,
      baseX: note.x,
      baseY: note.y,
      lastX: event.clientX,
      lastTime: event.timeStamp || performance.now(),
      moved: false,
    };

    lift(note.id, 'note');
    setArmedId(null);
  };

  const moveDrag = (event) => {
    const current = dragRef.current;

    if (!current) return;

    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;

    if (!current.moved && Math.hypot(dx, dy) < MOVE_THRESHOLD) return;

    current.moved = true;

    const now = event.timeStamp || performance.now();
    const elapsed = Math.max(8, now - current.lastTime);
    const speed = (event.clientX - current.lastX) / elapsed;

    current.lastX = event.clientX;
    current.lastTime = now;

    tiltRef.current += (dragTarget(speed) - tiltRef.current) * TILT_EASE;

    setDrag({ id: current.id, dx, dy, tilt: tiltRef.current });
  };

  const endDrag = (event) => {
    const current = dragRef.current;

    dragRef.current = null;
    setDrag(null);

    if (!current) return;

    if (!current.moved) {
      setEditingId(current.id);

      return;
    }

    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;

    commitNotes(
      notes.map((note) =>
        note.id === current.id
          ? {
              ...note,
              x: clamp(current.baseX + dx, 4, Math.max(4, window.innerWidth - 60)),
              y: clamp(current.baseY + dy, 4, Math.max(4, window.innerHeight - 40)),
              angle: noTilt ? 0 : settleAngle(note.angle + tiltRef.current),
            }
          : note,
      ),
    );
  };

  const finishEditing = (note) => {
    setEditingId(null);

    if (!note.text.trim()) commitNotes(notes.filter((entry) => entry.id !== note.id));
    else commitNotes(notes);
  };

  const changeText = (id, text) => {
    setNotes((current) => current.map((note) => (note.id === id ? { ...note, text } : note)));

    const input = inputs.current[id];

    if (input) {
      input.style.height = 'auto';
      input.style.height = `${input.scrollHeight}px`;
    }
  };

  // First click arms, second click confirms: shared so neither kind vanishes on one click.
  const armClose = (id, confirm) => {
    if (armedId === id) {
      setArmedId(null);
      setEditingId((current) => (current === id ? null : current));
      confirm();

      return;
    }

    setArmedId(id);
    window.clearTimeout(disarmTimer.current);
    disarmTimer.current = window.setTimeout(() => setArmedId(null), ARM_TIMEOUT);
  };

  // Images

  const addImage = useCallback(
    async (file) => {
      const { src, ratio, transparent } = await prepareImage(file);
      const at = pointer.current ?? {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };
      // Wide and tall pictures both start at note width, so the first sight is a card, not a wall.
      const width = NOTE_WIDTH;
      const height = width / ratio;

      const image = {
        id: `i${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        x: clamp(at.x - width / 2, 8, Math.max(8, window.innerWidth - width - 8)),
        y: clamp(at.y - height / 2, 8, Math.max(8, window.innerHeight - height - 8)),
        width,
        ratio,
        angle: noTilt ? 0 : randomTilt(),
        z: nextZ(),
        src,
        transparent,
      };

      await commitImages((current) => [...current, image]);
    },
    [noTilt, commitImages],
  );

  // A left click anywhere that is not a note or a picture takes the controls off the one
  // in hand: the page, a widget, its buttons, the Search/Ask Bar, the photo credit.
  useEffect(() => {
    if (!notesOn && !imagesOn) return undefined;

    const onPointerDown = (event) => {
      if (event.button !== 0) return;
      if (event.target?.closest?.('.scratchNote, .scratchImage')) return;

      setFocused(null);
      setArmedId(null);
    };

    // Capture, so this settles before the thing that was clicked handles its own press.
    document.addEventListener('pointerdown', onPointerDown, true);

    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [imagesOn, notesOn, setNotes]);

  // Pictures stored before the sticker rule carry no flag: read the pixels once, then keep it.
  useEffect(() => {
    const pending = images.find((image) => typeof image.transparent !== 'boolean');

    if (!pending) return;

    const settle = (transparent) =>
      commitImages(
        images.map((image) => (image.id === pending.id ? { ...image, transparent } : image)),
      );

    detectTransparency(pending.src).then(settle, () => settle(false));
  }, [commitImages, images]);

  useEffect(() => {
    const track = (event) => {
      pointer.current = { x: event.clientX, y: event.clientY };
    };

    window.addEventListener('pointermove', track, { passive: true });

    return () => window.removeEventListener('pointermove', track);
  }, []);

  // A paste on the page makes a picture; a paste inside a field stays that field's.
  useEffect(() => {
    if (!imagesOn) return undefined;

    const onPaste = (event) => {
      if (event.target?.closest?.(TYPING)) return;

      const items = [...(event.clipboardData?.items || [])];
      const picture = items.find((item) => item.kind === 'file' && item.type.startsWith('image/'));

      if (!picture) return;

      const file = picture.getAsFile();

      if (!file) return;

      event.preventDefault();
      addImage(file).catch(() => {});
    };

    document.addEventListener('paste', onPaste);

    return () => document.removeEventListener('paste', onPaste);
  }, [addImage, imagesOn]);

  const startImageDrag = (event, image) => {
    if (event.button !== 0) return;
    if (event.target.closest('.scratchImageButton, .scratchImageResize')) return;

    event.currentTarget.setPointerCapture?.(event.pointerId);

    tiltRef.current = 0;
    setFocused(image.id);

    imageDragRef.current = {
      mode: 'move',
      id: image.id,
      startX: event.clientX,
      startY: event.clientY,
      baseX: image.x,
      baseY: image.y,
      startWidth: image.width,
      lastX: event.clientX,
      lastTime: event.timeStamp || performance.now(),
      moved: false,
    };

    lift(image.id, 'image');
  };

  const moveImageDrag = (event) => {
    const current = imageDragRef.current;

    if (!current) return;

    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;

    if (current.mode === 'resize') {
      const width = clamp(current.startWidth + dx, IMAGE_MIN_WIDTH, IMAGE_MAX_WIDTH);

      setImageDrag({ id: current.id, mode: 'resize', dx: 0, dy: 0, width });

      return;
    }

    if (!current.moved && Math.hypot(dx, dy) < MOVE_THRESHOLD) return;

    current.moved = true;

    const now = event.timeStamp || performance.now();
    const elapsed = Math.max(8, now - current.lastTime);
    const speed = (event.clientX - current.lastX) / elapsed;

    current.lastX = event.clientX;
    current.lastTime = now;

    tiltRef.current += (dragTarget(speed) - tiltRef.current) * TILT_EASE;

    setImageDrag({ id: current.id, mode: 'move', dx, dy, tilt: tiltRef.current });
  };

  const endImageDrag = (event) => {
    const current = imageDragRef.current;

    imageDragRef.current = null;
    setImageDrag(null);

    if (!current) return;

    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;

    if (current.mode === 'resize') {
      const width = clamp(current.startWidth + dx, IMAGE_MIN_WIDTH, IMAGE_MAX_WIDTH);

      commitImages(
        images.map((image) =>
          image.id === current.id
            ? {
                ...image,
                width,
                x: clamp(image.x, 4, Math.max(4, window.innerWidth - 60)),
                y: clamp(image.y, 4, Math.max(4, window.innerHeight - 40)),
              }
            : image,
        ),
      );

      return;
    }

    if (!current.moved) return;

    commitImages(
      images.map((image) =>
        image.id === current.id
          ? {
              ...image,
              x: clamp(current.baseX + dx, 4, Math.max(4, window.innerWidth - 60)),
              y: clamp(current.baseY + dy, 4, Math.max(4, window.innerHeight - 40)),
              angle: noTilt ? 0 : settleAngle(image.angle + tiltRef.current),
            }
          : image,
      ),
    );
  };

  const startResize = (event, image) => {
    if (event.button !== 0) return;

    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setFocused(image.id);

    imageDragRef.current = {
      mode: 'resize',
      id: image.id,
      startX: event.clientX,
      startY: event.clientY,
      baseX: image.x,
      baseY: image.y,
      startWidth: image.width,
      lastX: event.clientX,
      lastTime: event.timeStamp || performance.now(),
      moved: true,
    };

    lift(image.id, 'image');
  };

  const removeImage = (id) => commitImages(images.filter((image) => image.id !== id));

  const copyImage = async (image) => {
    window.clearTimeout(copyTimer.current);
    setCopyFailed(null);

    try {
      const png = await toPngBlob(image.src);

      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        throw new Error('This browser will not take an image on the clipboard.');
      }

      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);

      setCopiedId(image.id);
      copyTimer.current = window.setTimeout(() => setCopiedId(null), 1300);
    } catch {
      // A plain refusal beats a tick over a copy that never happened.
      setCopiedId(null);
      setCopyFailed(image.id);
      copyTimer.current = window.setTimeout(() => setCopyFailed(null), 2400);
    }
  };

  const downloadImage = (image) => {
    const extension = image.src.startsWith('data:image/png') ? 'png' : 'webp';
    const link = document.createElement('a');

    link.href = image.src;
    link.download = `moo-scratch-${image.id}.${extension}`;
    link.click();
  };

  // Both

  useEffect(() => {
    if (!notesOn && !imagesOn) return undefined;

    const fit = () => {
      setNotes((current) =>
        current.map((note) => ({
          ...note,
          x: clamp(note.x, 8, Math.max(8, window.innerWidth - 80)),
          y: clamp(note.y, 8, Math.max(8, window.innerHeight - 60)),
        })),
      );
      setImages((current) =>
        current.map((image) => ({
          ...image,
          x: clamp(image.x, 8, Math.max(8, window.innerWidth - 80)),
          y: clamp(image.y, 8, Math.max(8, window.innerHeight - 60)),
        })),
      );
    };

    fit();
    window.addEventListener('resize', fit);

    return () => window.removeEventListener('resize', fit);
  }, [imagesOn, notesOn, setNotes]);

  useEffect(
    () => () => {
      window.clearTimeout(disarmTimer.current);
      window.clearTimeout(copyTimer.current);
    },
    [],
  );

  if (!notesOn && !imagesOn) return null;

  const error = notesProblem || imageError || saveError;

  return (
    <div className="scratchLayer">
      {error && (
        <div className="scratchSaveError" role="alert">
          <span>{error}</span>
          {notesProblem && (
            <button
              type="button"
              onClick={() =>
                saveFile(
                  { scratchNotesData: localStorage.getItem(NOTES_STORE) },
                  'moo-notes-recovery.json',
                )
              }
            >
              Save original notes
            </button>
          )}
        </div>
      )}
      {notesOn &&
        notes.map((note, index) => {
          const editing = editingId === note.id;
          const active = drag?.id === note.id;
          const angle = noTilt ? 0 : note.angle + (active ? drag.tilt : 0);
          // Bare is a resting state, not a mode: the frame comes back the moment the note is
          // in hand, whether that is a click, a drag or the caret.
          const frameless = bare && !editing && !active && focused !== note.id;

          return (
            <div
              key={note.id}
              className={`scratchNote${editing ? ' editing' : ''}${active ? ' dragging' : ''}${
                focused === note.id ? ' focused' : ''
              }${frameless ? ' bare' : ''}`}
              style={{
                left: note.x + (active ? drag.dx : 0),
                top: note.y + (active ? drag.dy : 0),
                zIndex: note.z,
                transform: `rotate(${angle.toFixed(2)}deg)`,
                // Behind the page, then staggered so the notes assemble rather than
                // appearing at once.
                animationDelay: entrance(note.id, index),
              }}
              onPointerDown={(event) => startDrag(event, note)}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <button
                type="button"
                className={`scratchNoteClose${armedId === note.id ? ' armed' : ''}`}
                onClick={() =>
                  armClose(note.id, () => commitNotes(notes.filter((item) => item.id !== note.id)))
                }
                title={armedId === note.id ? 'Click again to remove' : 'Remove note'}
                aria-label={armedId === note.id ? 'Click again to remove the note' : 'Remove note'}
              >
                ×
              </button>
              {editing ? (
                <textarea
                  ref={(element) => {
                    inputs.current[note.id] = element;
                  }}
                  className="scratchNoteInput"
                  readOnly={Boolean(notesProblem)}
                  value={note.text}
                  placeholder={uiText('write_here_markdown_supported_e2bd9d')}
                  autoFocus
                  onChange={(event) => changeText(note.id, event.target.value)}
                  onBlur={() => finishEditing(note)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') event.currentTarget.blur();
                  }}
                />
              ) : (
                <div
                  className="scratchNoteBody"
                  role="button"
                  tabIndex={0}
                  aria-label={uiText('edit_note_9751b2')}
                  onClick={() => {
                    setEditingId(note.id);
                    setFocused(note.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setEditingId(note.id);
                      setFocused(note.id);
                    }
                    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
                      event.preventDefault();
                      const step = event.shiftKey ? 20 : 5;
                      commitNotes(
                        notes.map((item) =>
                          item.id === note.id
                            ? {
                                ...item,
                                x: clamp(
                                  item.x +
                                    (event.key === 'ArrowLeft'
                                      ? -step
                                      : event.key === 'ArrowRight'
                                        ? step
                                        : 0),
                                  8,
                                  Math.max(8, window.innerWidth - NOTE_WIDTH),
                                ),
                                y: clamp(
                                  item.y +
                                    (event.key === 'ArrowUp'
                                      ? -step
                                      : event.key === 'ArrowDown'
                                        ? step
                                        : 0),
                                  8,
                                  Math.max(8, window.innerHeight - 100),
                                ),
                              }
                            : item,
                        ),
                      );
                    }
                  }}
                >
                  <Markdown text={note.text} />
                </div>
              )}
            </div>
          );
        })}

      {imagesOn &&
        images.map((image, index) => {
          const active = imageDrag?.id === image.id;
          const width = active && imageDrag.mode === 'resize' ? imageDrag.width : image.width;
          const angle = noTilt ? 0 : image.angle + (active && imageDrag.tilt ? imageDrag.tilt : 0);

          return (
            <div
              key={image.id}
              className={`scratchImage${active ? ' dragging' : ''}${
                focused === image.id ? ' focused' : ''
              }${image.transparent ? ' sticker' : ''}`}
              style={{
                left: image.x + (active && imageDrag.mode === 'move' ? imageDrag.dx : 0),
                top: image.y + (active && imageDrag.mode === 'move' ? imageDrag.dy : 0),
                width,
                aspectRatio: image.ratio,
                zIndex: image.z,
                transform: `rotate(${angle.toFixed(2)}deg)`,
                // Pictures follow the notes, so both kinds assemble in one run.
                animationDelay: entrance(image.id, index + notes.length),
              }}
              onPointerDown={(event) => startImageDrag(event, image)}
              onPointerMove={moveImageDrag}
              onPointerUp={endImageDrag}
              onPointerCancel={endImageDrag}
            >
              <img src={image.src} alt="Pasted on the page" draggable={false} />
              <button
                type="button"
                className={`scratchImageButton scratchImageCopy${
                  copyFailed === image.id ? ' refused' : ''
                }`}
                title={
                  copyFailed === image.id
                    ? 'The clipboard refused this picture'
                    : 'Copy to the clipboard'
                }
                aria-label={uiText('copy_this_picture_72ef7d')}
                onClick={() => copyImage(image)}
              >
                {copiedId === image.id ? '✓' : copyFailed === image.id ? '!' : '⧉'}
              </button>
              <button
                type="button"
                className={`scratchImageButton scratchImageClose${
                  armedId === image.id ? ' armed' : ''
                }`}
                title={armedId === image.id ? 'Click again to remove' : 'Remove picture'}
                aria-label={
                  armedId === image.id ? 'Click again to remove the picture' : 'Remove this picture'
                }
                onClick={() => armClose(image.id, () => removeImage(image.id))}
              >
                ×
              </button>
              <button
                type="button"
                className="scratchImageButton scratchImageDownload"
                title={uiText('save_to_a_file_5bb648')}
                aria-label={uiText('download_this_picture_623817')}
                onClick={() => downloadImage(image)}
              >
                ↓
              </button>
              <span
                className="scratchImageResize"
                role="button"
                tabIndex={0}
                title={uiText('drag_to_resize_or_use_the_arrow_keys_44c451')}
                onKeyDown={(event) => {
                  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key))
                    return;
                  event.preventDefault();
                  const change = ['ArrowLeft', 'ArrowDown'].includes(event.key) ? -10 : 10;
                  commitImages(
                    images.map((item) =>
                      item.id === image.id
                        ? {
                            ...item,
                            width: clamp(
                              item.width + change,
                              80,
                              Math.max(80, window.innerWidth - 16),
                            ),
                          }
                        : item,
                    ),
                  );
                }}
                aria-label={uiText('resize_this_picture_4a327d')}
                onPointerDown={(event) => startResize(event, image)}
                onPointerMove={moveImageDrag}
                onPointerUp={endImageDrag}
                onPointerCancel={endImageDrag}
              />
            </div>
          );
        })}
    </div>
  );
};

export { Scratch as default, Scratch };
