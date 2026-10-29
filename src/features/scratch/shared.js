/**
 * Rules shared by Floating Notes and Images: note width, lean range, and the
 * pointer distance that separates a click from a drag.
 */

const NOTE_WIDTH = 240;
// A fresh note leans a little so it reads as paper, but stays under four degrees
// to keep text upright.
const MIN_TILT = 1.2;
const MAX_TILT = 3.6;
// Degrees of lean a fast drag adds, before clamping.
const DRAG_TILT = 6;
// Fraction of the way to the target lean covered per pointer move.
const TILT_EASE = 0.2;
const MOVE_THRESHOLD = 4;

// Pasting re-encodes the picture, so one screenshot cannot fill the storage the
// notes share. Edge lengths are px.
const IMAGE_MAX_EDGE = 1600;
const IMAGE_QUALITY = 0.86;
const IMAGE_MIN_WIDTH = 120;
const IMAGE_MAX_WIDTH = 900;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/** Clamps a released note's lean into the readable range, never perfectly straight. */
const settleAngle = (angle) => {
  const size = clamp(Math.abs(angle), MIN_TILT, MAX_TILT);

  return Number((angle < 0 ? -size : size).toFixed(2));
};

const randomTilt = () =>
  (MIN_TILT + Math.random() * (MAX_TILT - MIN_TILT)) * (Math.random() < 0.5 ? -1 : 1);

/** Speed is px per ms, so lean follows the gesture rather than the frame rate. */
const dragTarget = (speed) => clamp(speed * 120, -DRAG_TILT, DRAG_TILT);

/** Locked floating items stay above normal content without changing order when selected. */
const stackingOrder = (notes, images) => {
  const entries = [
    ...notes.map((note) => ({ key: `note:${note.id}`, z: note.z, locked: note.locked === true })),
    ...images.map((image) => ({
      key: `image:${image.id}`,
      z: image.z,
      locked: image.locked === true,
    })),
  ];
  entries.sort(
    (left, right) => Number(left.locked) - Number(right.locked) || (left.z || 0) - (right.z || 0),
  );
  return new Map(entries.map((item, index) => [item.key, index + 1]));
};

export {
  NOTE_WIDTH,
  MIN_TILT,
  MAX_TILT,
  DRAG_TILT,
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
  stackingOrder,
};
