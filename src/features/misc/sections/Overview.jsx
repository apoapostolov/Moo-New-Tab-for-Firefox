import { useState, useEffect, useCallback, useRef } from 'react';
import { MdOutlineDragIndicator } from 'react-icons/md';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  pointerWithin,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

// Zones in the order they are drawn around the preview.
const ZONE_TITLES = { left: 'Left', center: 'Centre', right: 'Right' };

// Ms a card must be held over another in the middle column before that one steps
// aside: long enough that dragging past a row never triggers it.
const HOLD_MS = 260;

const widgetLabel = (id) => {
  const widget = WIDGETS.find((item) => item.id === id);

  return widget ? widget.label() : id;
};

/**
 * A row wins over the container it sits in, and a container only answers where
 * the pointer is really inside it, so a far corner cannot claim a drop aimed at a row.
 */
const collisionDetection = (args) => {
  const hits = pointerWithin(args);

  if (hits.length === 0) return closestCorners(args);

  const row = hits.find((hit) => !ZONES.includes(hit.id));

  return row ? [row] : hits;
};

const SortableItem = ({ id, enabled, onToggle, secondColumn, makingRoom }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const className = [
    'sortableItem',
    secondColumn ? 'inSecondColumn' : '',
    makingRoom ? 'makingRoom' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li ref={setNodeRef} style={style} {...attributes} className={className} data-widget-id={id}>
      <span className="dragHandle" {...listeners}>
        <MdOutlineDragIndicator />
      </span>
      <span style={{ flex: 1 }}>{widgetLabel(id)}</span>
      <input type="checkbox" checked={enabled} onChange={() => onToggle(id)} />
    </li>
  );
};

/** A drop container: the whole box is the target, so an empty zone still accepts a widget. */
const Zone = ({ zone, items, onToggle, isEnabled, secondLane, makingRoomId, hovered }) => {
  const { setNodeRef, isOver } = useDroppable({ id: zone });
  const className = `widgetZone${isOver || hovered ? ' widgetZoneOver' : ''}`;

  return (
    <div ref={setNodeRef} className={className} data-zone={zone}>
      <span className="title">{ZONE_TITLES[zone]}</span>
      <SortableContext id={zone} items={items} strategy={verticalListSortingStrategy}>
        <ul className="sortableContainer">
          {items.length === 0 ? <li className="widgetZoneEmpty">Drop a widget here</li> : null}
          {items.map((id) => (
            <SortableItem
              key={id}
              id={id}
              enabled={isEnabled(id)}
              onToggle={onToggle}
              secondColumn={zone === 'center' && secondLane.includes(id)}
              makingRoom={zone === 'center' && makingRoomId === id}
            />
          ))}
        </ul>
      </SortableContext>
    </div>
  );
};

const Overview = () => {
  const [groups, setGroups] = useState(() => groupByZone(readOrder(), readPlacement()));
  const [secondLane, setSecondLane] = useState(readSecondLane);
  // The card held long enough to step aside.
  const [steppedAside, setSteppedAside] = useState(null);
  // The column being dragged over; it highlights without any list moving mid-gesture.
  const [hoverZone, setHoverZone] = useState(null);
  const holdRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findZone = useCallback((id) => ZONES.find((zone) => groups[zone].includes(id)), [groups]);

  const zoneFor = (over) => {
    if (!over) return null;

    return ZONES.includes(over.id) ? over.id : findZone(over.id);
  };

  const clearHold = useCallback(() => {
    if (holdRef.current) {
      clearTimeout(holdRef.current.timer);
      holdRef.current = null;
    }

    setSteppedAside(null);
  }, []);

  /**
   * Holding over a row asks it to step aside. The timer is per target, so a card
   * that is only passed over never fires.
   */
  const holdOver = useCallback((id) => {
    if (holdRef.current?.id === id) return;

    if (holdRef.current) clearTimeout(holdRef.current.timer);

    if (!id) {
      holdRef.current = null;
      setSteppedAside(null);

      return;
    }

    holdRef.current = {
      id,
      timer: setTimeout(() => {
        holdRef.current = null;
        setSteppedAside(id);
      }, HOLD_MS),
    };
  }, []);

  /**
   * Nothing moves between lists while a card is in the air: moving a row to another
   * container unmounts the element dnd-kit is dragging, which ends the gesture and
   * drops the card back where it came from. So the drag only lights up the column
   * it is over, and the move happens once, on drop.
   */
  const handleDragOver = ({ active, over }) => {
    const from = findZone(active.id);
    const to = zoneFor(over);

    const overCentreRow =
      Boolean(over) &&
      !ZONES.includes(over.id) &&
      over.id !== active.id &&
      from === 'center' &&
      to === 'center' &&
      // Only a card has a second column to move into; full-width lines stay put.
      !isFullWidth(over.id) &&
      !isFullWidth(active.id);

    holdOver(overCentreRow ? over.id : null);
    setHoverZone(to && to !== from ? to : null);
  };

  /**
   * The row the card was left over. `over` may be the container instead, which has
   * no row to index from, so the card's own centre answers.
   */
  const dropIndex = (zone, ids, active, over) => {
    if (over && ids.includes(over.id)) return ids.indexOf(over.id);

    const dragged = active.rect?.current?.translated;

    if (!dragged) return -1;

    const centre = dragged.top + dragged.height / 2;
    // The dragged card follows the pointer, so over its own list it resolves to its
    // own index and leaves the list alone; in another column it is not in the list
    // and the nearest row answers instead.
    const rows = [...document.querySelectorAll(`.widgetZone[data-zone="${zone}"] .sortableItem`)];

    let best = -1;
    let nearest = Infinity;

    rows.forEach((row) => {
      const index = ids.indexOf(row.dataset.widgetId);

      if (index < 0) return;

      const box = row.getBoundingClientRect();
      const distance = Math.abs(box.top + box.height / 2 - centre);

      if (distance < nearest) {
        nearest = distance;
        best = index;
      }
    });

    return best;
  };

  /**
   * The card joins the column of the card it was dropped beside; dropped anywhere
   * else in the middle it goes to the first.
   */
  const laneFor = (id, over) => {
    const beside = over && groups.center.includes(over.id) && over.id !== id ? over.id : null;

    return beside && secondLane.includes(beside) ? [...lane(), id] : lane();
  };

  const lane = (id) => secondLane.filter((item) => item !== id);

  const handleDragEnd = ({ active, over }) => {
    const aside = steppedAside;

    clearHold();
    setHoverZone(null);

    const from = findZone(active.id);
    const to = zoneFor(over);

    if (!from || !to) return;

    if (to !== 'center') {
      // Leaving the middle column also leaves its second lane.
      setSecondLane(lane(active.id));
    } else if (aside && aside !== active.id) {
      // Dropped into the space the held card opened: the dragged card takes that
      // place in the first column, the held one keeps the second.
      setSecondLane([...lane(active.id).filter((id) => id !== aside), aside]);

      setGroups((previous) => {
        const rest = previous.center.filter((id) => id !== active.id);
        const at = rest.indexOf(aside);

        return {
          ...previous,
          center:
            at < 0 ? [...rest, active.id] : [...rest.slice(0, at), active.id, ...rest.slice(at)],
        };
      });

      return;
    } else if (from === 'center' || to === 'center') {
      setSecondLane(laneFor(active.id, over));
    }

    const target = dropIndex(to, groups[to], active, over);

    if (from === to) {
      const current = groups[from].indexOf(active.id);

      if (target < 0 || target === current) return;

      setGroups((previous) => ({
        ...previous,
        [from]: arrayMove(previous[from], current, target),
      }));

      return;
    }

    setGroups((previous) => {
      const next = {
        left: [...previous.left],
        center: [...previous.center],
        right: [...previous.right],
      };

      next[from] = next[from].filter((id) => id !== active.id);

      const at = target < 0 || target > next[to].length ? next[to].length : target;

      next[to].splice(at, 0, active.id);

      return next;
    });
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

    // One column until something sits in the second, or until a card is held aside.
    const aside = steppedAside && items.some(({ id }) => id === steppedAside) ? steppedAside : null;

    if (zone !== 'center' || (!aside && secondLane.length === 0)) {
      return (
        <div className={`previewZone previewZone-${zone}`}>
          {items.map((item) => previewCard(item, isFullWidth(item.id)))}
        </div>
      );
    }

    const inSecond = (id) => (aside ? id === aside : secondLane.includes(id));
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

  return (
    <>
      <span className="mainTitle">
        {variables.getMessage('modals.main.marketplace.product.overview')}
      </span>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={clearHold}
      >
        <div className="overviewZones">
          <div className="overviewSide overviewSide-left">
            <Zone
              zone="left"
              items={groups.left}
              onToggle={toggleEnabled}
              isEnabled={isWidgetEnabled}
              secondLane={secondLane}
              hovered={hoverZone === 'left'}
            />
          </div>

          <div className="overviewPreview">
            <span className="title">{variables.getMessage('modals.welcome.buttons.preview')}</span>
            <div className="tabPreview">
              {previewZone('left')}
              {previewZone('center')}
              {previewZone('right')}
            </div>
          </div>

          <div className="overviewSide overviewSide-right">
            <Zone
              zone="right"
              items={groups.right}
              onToggle={toggleEnabled}
              isEnabled={isWidgetEnabled}
              secondLane={secondLane}
              hovered={hoverZone === 'right'}
            />
          </div>

          <div className="overviewBelow">
            <Zone
              zone="center"
              items={groups.center}
              onToggle={toggleEnabled}
              isEnabled={isWidgetEnabled}
              secondLane={secondLane}
              makingRoomId={steppedAside}
              hovered={hoverZone === 'center'}
            />
          </div>
        </div>
      </DndContext>
    </>
  );
};

export { Overview as default, Overview };
