import { memo } from 'react';

function QuickWeatherSkeleton() {
  return <span className="quickweather">Weather Now</span>;
}

export default memo(QuickWeatherSkeleton);
