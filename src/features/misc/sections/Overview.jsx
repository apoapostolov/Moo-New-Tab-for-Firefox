import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MdOutlineDragIndicator } from 'react-icons/md';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import variables from 'config/variables';
import Clock from './overview_skeletons/Clock';
import QuickLinks from './overview_skeletons/QuickLinks';
import Date from './overview_skeletons/Date';
import QuickWeather from './overview_skeletons/QuickWeather';
import WidgetThumb from './overview_skeletons/WidgetThumb';
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
  isFullWidth,
} from 'utils/widgets';

import EventBus from 'utils/eventbus';

const ZONE_TITLES = { left: 'Left', center: 'Center', right: 'Right' };

// Stands in for the card being dragged while the columns are drawn, so a column can
// open a space for it without holding on to it.
const SLOT = '\u0000slot';

// How far past a row edge still counts as the line between two rows.
const GAP_REACH = 2;

const widgetLabel = (id) => {
  const widget = WIDGETS.find((item) => item.id === id);

  return widget ? widget.label() : id;
};

/**
 * A column is read as rows: the rails hold one card per row, the middle column holds
 * two once a pair has been made. A second card only joins the row above it, so a pair
 * can never become a row of three.
 */
const toRows = (ids, secondLane) => {
  const rows = [];

  ids.forEach((id) => {
    const last = rows[rows.length - 1];

    if (secondLane.includes(id) && last && last.length === 1) last.push(id);
    else rows.push([id]);
  });

  return rows;
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

const Card = ({ id, enabled, onToggle }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({ id });

  return (
    <div ref={setNodeRef} className="zoneCard" data-widget-id={id} {...attributes}>
      <span className="dragHandle" {...listeners} aria-label={`Move ${widgetLabel(id)}`}>
        <MdOutlineDragIndicator />
      </span>
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
const Slot = ({ label }) => (
  <span className="dropSlot">{label ? <span className="dropSlotLabel">{label}</span> : null}</span>
);

/**
 * The line between two rows of the middle column. It is drawn only while a card is in
 * the air, and its negative margins cancel the space it takes, so the column does not
 * jump when the drag starts. As the target it opens to the height of a card.
 */
const Gap = ({ open }) => <div className={`dropGap${open ? ' dropGap-open' : ''}`} />;

const Zone = ({ zone, rows, onToggle, isEnabled, activeId, gapAt, slotOpen }) => {
  // Only the middle column needs lines between rows: on a rail the halves of a card
  // already mean before and after.
  const gaps = zone === 'center' && activeId !== null;

  return (
    <div className="widgetZone" data-zone={zone}>
      <span className="zoneTitle">{ZONE_TITLES[zone]}</span>

      <div className="zoneCards">
        {rows.length === 0 ? (
          <span className={`dropSlot${slotOpen ? ' dropSlotOver' : ''}`}>
            <span className="dropSlotLabel">Drop a widget here</span>
          </span>
        ) : null}

        {rows.map((row, index) => {
          const key = row.find((id) => id !== SLOT) || `slot-${zone}`;

          return (
            <Fragment key={key}>
              {gaps ? <Gap open={gapAt === index} /> : null}

              <div className={`zoneRow${row.length === 1 ? ' isSingle' : ''}`}>
                {row.map((id) =>
                  id === SLOT ? (
                    <Slot key="slot" />
                  ) : (
                    <Card
                      key={id}
                      id={id}
                      enabled={isEnabled(id)}
                      onToggle={onToggle}
                      dragging={id === activeId}
                    />
                  ),
                )}
              </div>
            </Fragment>
          );
        })}

        {gaps && rows.length ? <Gap open={gapAt === rows.length} /> : null}
      </div>
    </div>
  );
};

const Overview = () => {
  const [groups, setGroups] = useState(() => groupByZone(readOrder(), readPlacement()));
  const [secondLane, setSecondLane] = useState(readSecondLane);
  const [activeId, setActiveId] = useState(null);
  const [activeWidth, setActiveWidth] = useState(null);
  const [target, setTarget] = useState(null);
  const pointer = useRef({ x: 0, y: 0 });
  const geometry = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  const findZone = useCallback((id) => ZONES.find((zone) => groups[zone].includes(id)), [groups]);

  const rowsFor = useCallback(
    (zone, insert) => {
      const base = toRows(groups[zone], secondLane)
        .map((row) => row.filter((id) => id !== activeId))
        .filter((row) => row.length > 0);

      if (!target || target.zone !== zone) return base;

      return placeRows({
        zone,
        rows: base,
        insert,
        overId: target.overId,
        side: target.side,
        index: target.index,
        insertWide: isFullWidth(activeId),
      });
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

    const current = localStorage.getItem(widget.setting) === 'true';

    localStorage.setItem(widget.setting, String(!current));
    variables.stats.postEvent('setting', 'Widget toggle');
    EventBus.emit('refresh', 'widgets');
    // Checkbox state lives in localStorage, so the list is re-read rather than tracked twice.
    setGroups((previous) => ({ ...previous }));
  };

  // Persists on every change: order, the zone each widget sits in, and the middle lane.
  useEffect(() => {
    saveOrder([...groups.left, ...groups.center, ...groups.right]);
    savePlacement(placementFromGroups(groups));
    saveSecondLane(secondLane.filter((id) => groups.center.includes(id) && !isFullWidth(id)));
    variables.stats.postEvent('setting', 'Widget placement');
    EventBus.emit('refresh', 'widgets');
  }, [groups, secondLane]);

  const previewItem = (id) => {
    switch (id) {
      case 'time':
        return <Clock />;
      case 'date':
        return <Date />;
      case 'quickweather':
        return <QuickWeather />;
      case 'quicklinks':
        return <QuickLinks />;
      case 'aiask':
        // The query line is a hint and a hairline, so the preview draws that and no card.
        return (
          <div className="aiAskSkeleton" aria-hidden="true">
            <span className="aiAskSkeletonText" />
            <span className="aiAskSkeletonLine" />
          </div>
        );
      // Weather Full is the page's own corner card and the zone list already names it.
      case 'photoinfo':
      case 'mail':
      case 'calendar':
      case 'tasks':
        return <WidgetThumb type={id} label={widgetLabel(id)} />;
      default:
        return null;
    }
  };

  // `wide` for the lines that read across the middle column: two cards wide, as on the page.
  const previewCard = ({ id, node }, wide = false) => (
    <div className={`previewItem${wide ? ' previewItem-wide' : ''}`} key={`preview-${id}`}>
      {node}
    </div>
  );

  const previewItems = (zone) =>
    groups[zone]
      .filter((id) => isWidgetEnabled(id))
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
          <div className="previewLane">{first.map(({ id, node }) => previewCard({ id, node }))}</div>
          <div className="previewLane">{second.map(({ id, node }) => previewCard({ id, node }))}</div>
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

  const gapAt = target && target.zone === 'center' && target.overId === null ? target.index : -1;

  return (
    <>
      <span className="mainTitle">
        {variables.getMessage('modals.main.marketplace.product.overview')}
      </span>

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
              isEnabled={isWidgetEnabled}
              activeId={activeId}
              slotOpen={target?.zone === 'left' && target.overId === null}
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
              isEnabled={isWidgetEnabled}
              activeId={activeId}
              slotOpen={target?.zone === 'right' && target.overId === null}
            />
          </div>

          <div className="overviewBelow">
            <Zone
              zone="center"
              rows={columns.center}
              onToggle={toggleEnabled}
              isEnabled={isWidgetEnabled}
              activeId={activeId}
              gapAt={gapAt}
              slotOpen={target?.zone === 'center' && target.overId === null}
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

export { Overview as default, Overview };
