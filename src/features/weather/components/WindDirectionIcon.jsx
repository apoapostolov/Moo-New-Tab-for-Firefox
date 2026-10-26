import { memo } from 'react';

import {
  WiDirectionDownLeft,
  WiDirectionDownRight,
  WiDirectionDown,
  WiDirectionLeft,
  WiDirectionRight,
  WiDirectionUpLeft,
  WiDirectionUpRight,
  WiDirectionUp,
} from 'react-icons/wi';

function WindDirectionIcon({ degrees }) {
  // 45° per entry, from north and counter-clockwise: 90° maps to West.
  const directions = [
    {
      name: 'North',
      icon: <WiDirectionUp />,
    },
    {
      name: 'North-West',
      icon: <WiDirectionUpLeft />,
    },
    {
      name: 'West',
      icon: <WiDirectionLeft />,
    },
    {
      name: 'South-West',
      icon: <WiDirectionDownLeft />,
    },
    {
      name: 'South',
      icon: <WiDirectionDown />,
    },
    {
      name: 'South-East',
      icon: <WiDirectionDownRight />,
    },
    {
      name: 'East',
      icon: <WiDirectionRight />,
    },
    {
      name: 'North-East',
      icon: <WiDirectionUpRight />,
    },
  ];
  const direction =
    directions[Math.round(((degrees %= 360) < 0 ? degrees + 360 : degrees) / 45) % 8];

  return direction && direction.icon;
}

export default memo(WindDirectionIcon);
