import { isFullWidth } from 'utils/widgets';

/** Match the page: full-width lines come before the cards that can share a row. */
export function overviewRows(ids, secondLane, zone) {
  const rows = [];
  const cards = zone === 'center' ? ids.filter((id) => !isFullWidth(id)) : ids;
  if (zone === 'center') ids.filter(isFullWidth).forEach((id) => rows.push([id]));
  cards.forEach((id) => {
    const last = rows.at(-1);
    if (zone === 'center' && secondLane.includes(id) && last?.length === 1 && !isFullWidth(last[0]))
      last.push(id);
    else rows.push([id]);
  });
  return rows;
}
