import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { memo } from 'react';

function DateSkeleton() {
  useTranslationVersion();
  return <span className="date">{uiText('thursday_january_1st_157956')}</span>;
}

export default memo(DateSkeleton);
