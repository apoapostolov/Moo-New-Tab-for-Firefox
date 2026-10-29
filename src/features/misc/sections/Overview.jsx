import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MdOutlineDragIndicator } from 'react-icons/md';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import variables from 'config/variables';
import { overviewRows } from './overviewLayout';
import WidgetPreview from './overview_skeletons/WidgetPreview';
import {
  WIDGETS,
  ZONES,
  readOrder,
  readPlacement,
  readSecondLane,
  saveOrder,
  savePlacement,
  saveSecondLane,
  groupByZone,
  placementFromGroups,
  isWidgetEnabled,
  setWidgetEnabled,
  isFullWidth,
} from 'utils/widgets';

import EventBus from 'utils/eventbus';

const ZONE_KEYS = { left: 'zone_left', center: 'zone_center', right: 'zone_right' };
const zoneTitle = (zone) => uiText(ZONE_KEYS[zone]);

// Stands in for the card being dragged while the columns are drawn, so a column can
// open a space for it without holding on to it.
const SLOT = '\u0000slot';

// How far past a row edge still counts as the line between two rows.
const GAP_REACH = 2;

const widgetLabel = (id) => {
  const widget = WIDGETS.find((item) => item.id === id);

  return widget ? widget.label() : id;
};

/** Rows back to a flat order and the middle column's second lane. */
const fromRows = (rows) => {
  const ids = [];
  const lane = [];

  rows.forEach((row) =>
    row.forEach((id, index) => {
      if (id === SLOT) return;

      ids.push(id);

      if (index === 1) lane.push(id);
    }),
  );

  return { ids, lane };
};

/**
 * The rows a drop produces. Over a lone card the arriving card takes the side the
 * pointer is on and that card steps to the other side, so the two share a row. A pair
 * already sharing a row stays together and the arriving card takes a row of its own
 * either side of it. On the line between rows it takes a row of its own there. In a
 * rail every row holds one card, so any drop simply opens a row.
 */
const placeRows = ({ zone, rows, insert, overId, side, index, insertWide }) => {
  const next = rows.map((row) => [...row]);
  // The clock, the date, the one-line weather and the query line read across the whole
  // middle column: they never take half of a row, and nothing pairs with them. The card
  // in the air is a placeholder in the preview, so its kind is passed in rather than read.
  const wide = insertWide || (overId ? isFullWidth(overId) : false);

  if (!overId) {
    next.splice(Math.min(index ?? 0, next.length), 0, [insert]);

    return next;
  }

  const at = next.findIndex((row) => row.includes(overId));

  if (at < 0) return [...next, [insert]];

  if (zone !== 'center') {
    next.splice(side === 'after' ? at + 1 : at, 0, [insert]);

    return next;
  }

  const row = next[at];

  if (row.length > 1 || wide) {
    next.splice(side === 'a' ? at : at + 1, 0, [insert]);

    return next;
  }

  next.splice(at, 1, side === 'b' ? [overId, insert] : [insert, overId]);

  return next;
};

/** Where the pointer sits on the cards as they were when the drag began. */
const captureGeometry = () => {
  const geometry = {};

  ZONES.forEach((zone) => {
    const column = document.querySelector(`.widgetZone[data-zone="${zone}"]`);

    if (!column) return;

    const box = column.getBoundingClientRect();

    geometry[zone] = {
      left: box.left,
      right: box.right,
      cards: [...column.querySelectorAll('.zoneCard')].map((card) => {
        const rect = card.getBoundingClientRect();

        return {
          id: card.dataset.widgetId,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };
      }),
      gaps: [...column.querySelectorAll('.dropGap')].map((gap, index) => {
        const rect = gap.getBoundingClientRect();

        return { index, top: rect.top, bottom: rect.bottom };
      }),
    };
  });

  return geometry;
};

/** The column the pointer is in, or the one it is nearest. */
const pickZone = (geometry, x) => {
  let best = null;
  let distance = Infinity;

  ZONES.forEach((zone) => {
    const column = geometry[zone];

    if (!column) return;

    const away = x < column.left ? column.left - x : x > column.right ? x - column.right : 0;

    if (away < distance) {
      distance = away;
      best = zone;
    }
  });

  return best;
};

/**
 * The place the card would land, read off the frozen geometry rather than the live
 * layout: the opening this answer draws changes the layout, and asking the changed
 * layout again would flip the answer back and forth until React gives up.
 */
const readTarget = (geometry, point) => {
  const zone = pickZone(geometry, point.x);

  if (!zone) return null;

  const column = geometry[zone];

  if (column.cards.length === 0) {
    return { zone, overId: null, side: zone === 'center' ? 'a' : 'after', index: 0 };
  }

  // In the middle column the line between two rows is a place of its own.
  if (zone === 'center') {
    const gap = column.gaps.find(
      (item) => point.y >= item.top - GAP_REACH && point.y <= item.bottom + GAP_REACH,
    );

    if (gap) return { zone, overId: null, side: 'at', index: gap.index };
  }

  let nearest = column.cards[0];
  let distance = Infinity;

  column.cards.forEach((card) => {
    const away =
      point.y < card.top ? card.top - point.y : point.y > card.bottom ? point.y - card.bottom : 0;

    if (away < distance) {
      distance = away;
      nearest = card;
    }
  });

  if (zone === 'center') {
    return {
      zone,
      overId: nearest.id,
      side: point.x < (nearest.left + nearest.right) / 2 ? 'a' : 'b',
    };
  }

  return {
    zone,
    overId: nearest.id,
    side: point.y < (nearest.top + nearest.bottom) / 2 ? 'before' : 'after',
  };
};

const sameTarget = (a, b) => {
  if (!a || !b) return a === b;

  return a.zone === b.zone && a.overId === b.overId && a.side === b.side && a.index === b.index;
};

const Card = ({ id, enabled, onToggle, onMove }) => {
  useTranslationVersion();
  const { attributes, listeners, setNodeRef } = useDraggable({ id });

  return (
    <div ref={setNodeRef} className="zoneCard" data-widget-id={id}>
      <button
        type="button"
        className="dragHandle"
        {...attributes}
        {...listeners}
        aria-describedby={undefined}
        aria-label={uiText('drag_named', { name: widgetLabel(id) })}
        aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight"
        onKeyDown={(event) => {
          if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
          event.preventDefault();
          event.stopPropagation();
          onMove(id, event.key, event.shiftKey);
        }}
      >
        <MdOutlineDragIndicator />
      </button>
      <span className="zoneCardLabel">{widgetLabel(id)}</span>
      <input
        type="checkbox"
        checked={enabled}
        aria-label={widgetLabel(id)}
        onChange={() => onToggle(id)}
      />
    </div>
  );
};

/** The space a card will land in: dim, bordered, and the size of a card. */
const Slot = ({ label, wide }) => (
  <span className={`dropSlot${wide ? ' dropSlot-wide' : ''}`}>
    {label ? <span className="dropSlotLabel">{label}</span> : null}
  </span>
);

/**
 * The line between two rows of the middle column. It is drawn only while a card is in
 * the air, and its negative margins cancel the space it takes, so the column does not
 * jump when the drag starts. It never opens: the opening is the slot row the drop
 * produces, which is the size of the widget on its way in.
 */
const Gap = () => <div className="dropGap" />;

const Zone = ({ zone, rows, onToggle, onMove, isEnabled, activeId, slotOpen, slotWide }) => {
  useTranslationVersion();
  // Only the middle column needs lines between rows: on a rail the halves of a card
  // already mean before and after.
  const gaps = zone === 'center' && activeId !== null;

  return (
    <div className="widgetZone" data-zone={zone}>
      <span className="zoneTitle">{zoneTitle(zone)}</span>

      <div className="zoneCards">
        {rows.length === 0 ? (
          <span className={`dropSlot${slotOpen ? ' dropSlotOver' : ''}`}>
            <span className="dropSlotLabel">{uiText('drop_a_widget_here_94afdc')}</span>
          </span>
        ) : null}

        {rows.map((row, index) => {
          const key = row.find((id) => id !== SLOT) || `slot-${zone}`;
          const wide = (items) => items.every((id) => (id === SLOT ? slotWide : isFullWidth(id)));
          const divider = zone === 'center' && index > 0 && wide(rows[index - 1]) && !wide(row);

          return (
            <Fragment key={key}>
              {divider && <hr className="zoneSectionDivider" />}
              {gaps ? <Gap /> : null}

              <div className={`zoneRow${row.length === 1 ? ' isSingle' : ''}`}>
                {row.map((id) =>
                  id === SLOT ? (
                    <Slot key="slot" wide={slotWide} />
                  ) : (
                    <Card
                      key={id}
                      id={id}
                      enabled={isEnabled(id)}
                      onToggle={onToggle}
                      onMove={onMove}
                      dragging={id === activeId}
                    />
                  ),
                )}
              </div>
            </Fragment>
          );
        })}

        {gaps && rows.length ? <Gap /> : null}
      </div>
    </div>
  );
};

const OverviewLayout = ({ profile }) => {
  useTranslationVersion();
  const [groups, setGroups] = useState(() =>
    groupByZone(readOrder(profile), readPlacement(profile)),
  );
  const [secondLane, setSecondLane] = useState(() => readSecondLane(profile));
  const [activeId, setActiveId] = useState(null);
  const [activeWidth, setActiveWidth] = useState(null);
  const [target, setTarget] = useState(null);
  const pointer = useRef({ x: 0, y: 0 });
  const geometry = useRef(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const findZone = useCallback((id) => ZONES.find((zone) => groups[zone].includes(id)), [groups]);

  const rowsFor = useCallback(
    (zone, insert) => {
      const base = overviewRows(groups[zone], secondLane, zone)
        .map((row) => row.filter((id) => id !== activeId))
        .filter((row) => row.length > 0);

      if (!target || target.zone !== zone) return base;

      const placed = placeRows({
        zone,
        rows: base,
        insert,
        overId: target.overId,
        side: target.side,
        index: target.index,
        insertWide: isFullWidth(activeId),
      });
      if (zone !== 'center') return placed;
      const wide = (row) =>
        row.every((id) => (id === insert ? isFullWidth(activeId) : isFullWidth(id)));
      return [...placed.filter(wide), ...placed.filter((row) => !wide(row))];
    },
    [groups, secondLane, activeId, target],
  );

  const clear = useCallback(() => {
    setActiveId(null);
    setActiveWidth(null);
    setTarget(null);
    geometry.current = null;
  }, []);

  /**
   * The pointer is followed directly, and the place it points at is read off the layout
   * as it stood when the drag began. Nothing here depends on the layout the drag itself
   * produces, so the target cannot flip back and forth.
   */
  const handleMove = (event) => {
    const { activatorEvent, delta } = event;

    if (activatorEvent?.clientX === undefined) return;

    pointer.current = { x: activatorEvent.clientX + delta.x, y: activatorEvent.clientY + delta.y };

    if (!geometry.current) geometry.current = captureGeometry();

    const next = readTarget(geometry.current, pointer.current);

    setTarget((current) => (sameTarget(current, next) ? current : next));
  };

  const handleDragEnd = () => {
    if (!activeId) {
      clear();

      return;
    }

    const from = findZone(activeId);
    const to = target?.zone ?? from;

    if (!from || !to) {
      clear();

      return;
    }

    const center = fromRows(rowsFor('center', activeId));
    const placed = to === 'center' ? center.ids : fromRows(rowsFor(to, activeId)).ids;

    setGroups((previous) => ({
      ...previous,
      [from]: previous[from].filter((id) => id !== activeId),
      center: center.ids,
      ...(to === 'center' ? {} : { [to]: placed }),
    }));

    setSecondLane(center.lane);
    clear();
  };

  const toggleEnabled = (id) => {
    const widget = WIDGETS.find((item) => item.id === id);

    if (!widget) return;

    const current = isWidgetEnabled(id, profile);

    setWidgetEnabled(id, !current, profile);
    variables.stats.postEvent('setting', 'Widget toggle');
    EventBus.emit('refresh', 'widgets');
    // Checkbox state lives in localStorage, so the list is re-read rather than tracked twice.
    setGroups((previous) => ({ ...previous }));
  };

  const moveWithKeys = (id, key, shift) => {
    const zone = findZone(id);
    if (!zone || activeId) return;
    if (
      shift &&
      zone === 'center' &&
      !isFullWidth(id) &&
      ['ArrowLeft', 'ArrowRight'].includes(key)
    ) {
      setSecondLane((current) =>
        key === 'ArrowRight'
          ? [...new Set([...current, id])]
          : current.filter((item) => item !== id),
      );
    } else if (['ArrowLeft', 'ArrowRight'].includes(key)) {
      const destination = ZONES[ZONES.indexOf(zone) + (key === 'ArrowLeft' ? -1 : 1)];
      if (!destination) return;
      setGroups((current) => ({
        ...current,
        [zone]: current[zone].filter((item) => item !== id),
        [destination]: [...current[destination], id],
      }));
      setSecondLane((current) => current.filter((item) => item !== id));
    } else {
      setGroups((current) => {
        const items = [...current[zone]];
        const peers = items.filter(
          (item) => zone !== 'center' || isFullWidth(item) === isFullWidth(id),
        );
        const other = peers[peers.indexOf(id) + (key === 'ArrowUp' ? -1 : 1)];
        if (!other) return current;
        const from = items.indexOf(id);
        const to = items.indexOf(other);
        [items[from], items[to]] = [items[to], items[from]];
        return { ...current, [zone]: items };
      });
    }
    globalThis.requestAnimationFrame(() =>
      document.querySelector(`[data-widget-id="${id}"] .dragHandle`)?.focus(),
    );
  };

  // Persists on every change: order, the zone each widget sits in, and the middle lane.
  useEffect(() => {
    saveOrder([...groups.left, ...groups.center, ...groups.right], profile);
    savePlacement(placementFromGroups(groups), profile);
    saveSecondLane(
      secondLane.filter((id) => groups.center.includes(id) && !isFullWidth(id)),
      profile,
    );
    variables.stats.postEvent('setting', 'Widget placement');
    EventBus.emit('refresh', 'widgets');
  }, [groups, secondLane, profile]);

  const previewItem = (id) => <WidgetPreview id={id} label={widgetLabel(id)} />;

  // `wide` for the lines that read across the middle column: two cards wide, as on the page.
  const previewCard = ({ id, node }, wide = false) => (
    <div className={`previewItem${wide ? ' previewItem-wide' : ''}`} key={`preview-${id}`}>
      {node}
    </div>
  );

  const previewItems = (zone) =>
    groups[zone]
      .filter((id) => isWidgetEnabled(id, profile))
      .map((id) => ({ id, node: previewItem(id) }))
      .filter(({ node }) => node !== null);

  const previewZone = (zone) => {
    const items = previewItems(zone);

    // One column until something sits in the second.
    if (zone !== 'center' || secondLane.length === 0) {
      return (
        <div className={`previewZone previewZone-${zone}`}>
          {items.map((item) => previewCard(item, isFullWidth(item.id)))}
        </div>
      );
    }

    const inSecond = (id) => secondLane.includes(id);
    const lines = items.filter(({ id }) => isFullWidth(id));
    const first = items.filter(({ id }) => !isFullWidth(id) && !inSecond(id));
    const second = items.filter(({ id }) => !isFullWidth(id) && inSecond(id));

    return (
      <div className={`previewZone previewZone-${zone}`}>
        {lines.map((item) => previewCard(item, true))}
        <div className="previewLanes">
          <div className="previewLane">
            {first.map(({ id, node }) => previewCard({ id, node }))}
          </div>
          <div className="previewLane">
            {second.map(({ id, node }) => previewCard({ id, node }))}
          </div>
        </div>
      </div>
    );
  };

  const columns = useMemo(
    () =>
      ZONES.reduce((all, zone) => {
        all[zone] = rowsFor(zone, SLOT);

        return all;
      }, {}),
    [rowsFor],
  );

  // The opening is drawn at the size of the widget on its way in: a card takes one
  // column of the row, a full-width line takes the row.
  const slotWide = activeId ? isFullWidth(activeId) : false;

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={({ active }) => {
          const node = document.querySelector(`[data-widget-id="${active.id}"]`);
          const box = node?.getBoundingClientRect();

          setActiveWidth(box ? box.width : null);
          setActiveId(active.id);
        }}
        onDragMove={handleMove}
        onDragEnd={handleDragEnd}
        onDragCancel={clear}
      >
        <div className="overviewZones">
          <div className="overviewSide overviewSide-left">
            <Zone
              zone="left"
              rows={columns.left}
              onToggle={toggleEnabled}
              onMove={moveWithKeys}
              isEnabled={(id) => isWidgetEnabled(id, profile)}
              activeId={activeId}
              slotOpen={target?.zone === 'left' && target.overId === null}
              slotWide={slotWide}
            />
          </div>

          <div className="overviewPreview">
            <span className="zoneTitle">
              {variables.getMessage('modals.welcome.buttons.preview')}
            </span>
            <div className="tabPreview">
              {previewZone('left')}
              {previewZone('center')}
              {previewZone('right')}
            </div>
          </div>

          <div className="overviewSide overviewSide-right">
            <Zone
              zone="right"
              rows={columns.right}
              onToggle={toggleEnabled}
              onMove={moveWithKeys}
              isEnabled={(id) => isWidgetEnabled(id, profile)}
              activeId={activeId}
              slotOpen={target?.zone === 'right' && target.overId === null}
              slotWide={slotWide}
            />
          </div>

          <div className="overviewBelow">
            <Zone
              zone="center"
              rows={columns.center}
              onToggle={toggleEnabled}
              onMove={moveWithKeys}
              isEnabled={(id) => isWidgetEnabled(id, profile)}
              activeId={activeId}
              slotOpen={target?.zone === 'center' && target.overId === null}
              slotWide={slotWide}
            />
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeId ? (
            <div
              className="zoneCard dragCard"
              style={activeWidth ? { width: activeWidth } : undefined}
            >
              <span className="dragHandle">
                <MdOutlineDragIndicator />
              </span>
              <span className="zoneCardLabel">{widgetLabel(activeId)}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
};

const Overview = () => {
  useTranslationVersion();
  const [profile, setProfile] = useState('standard');
  return (
    <>
      <div className="overviewHeader">
        <span className="mainTitle">
          {variables.getMessage('modals.main.marketplace.product.overview')}
        </span>
        <div className="overviewProfile" role="group" aria-label={uiText('workspace_layout')}>
          {['standard', 'focus'].map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={profile === value}
              onClick={() => setProfile(value)}
            >
              {uiText(value === 'focus' ? 'workspace_focus' : 'workspace_standard')}
            </button>
          ))}
        </div>
      </div>
      <p className="overviewFocusHint">{uiText('workspace_layout_hint')}</p>
      <OverviewLayout key={profile} profile={profile} />
    </>
  );
};

export { Overview as default, Overview };
