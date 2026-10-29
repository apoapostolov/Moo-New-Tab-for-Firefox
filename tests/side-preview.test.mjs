import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sidePreviewPosition } from '../src/features/widgetKit/sidePreviewPosition.js';

test('side previews use the card side and viewport centre regardless of row height', () => {
  const viewport = { width: 1440, height: 900 };
  const leftCard = { left: 16, right: 356, width: 340 };
  const rightCard = { left: 1084, right: 1424, width: 340 };
  const left = sidePreviewPosition(leftCard, 300, 430, viewport);
  assert.equal(left.left, 368);
  assert.equal(left.top, 300);
  assert.equal(sidePreviewPosition(rightCard, 300, 430, viewport).left, 642);
  assert.equal(sidePreviewPosition({ ...leftCard, top: 700 }, 300, 430, viewport).top, 300);
});

test('long previews stay centred within the height cap and narrow previews stay on screen', () => {
  const position = sidePreviewPosition({ left: 16, right: 356, width: 340 }, 1200, 430, {
    width: 390,
    height: 600,
  });
  assert.equal(position.width, 342);
  assert.equal(position.maxHeight, 372);
  assert.equal(position.top, 114);
  assert.ok(position.left >= 16);
  assert.ok(position.left + position.width <= 374);
  assert.equal(
    sidePreviewPosition({ left: 0, right: 340, width: 340 }, 0, 280, {
      width: 390,
      height: 600,
    }).visibility,
    'hidden',
  );
});
