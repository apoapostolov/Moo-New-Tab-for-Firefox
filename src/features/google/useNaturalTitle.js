import { useEffect, useRef, useState } from 'react';

import { parseNatural } from './natural';

/**
 * Parses the title shortly after typing stops, then hands the result to the dialog so the
 * other fields can follow. The delay keeps it from filling a date mid-word.
 */
export const useNaturalTitle = (text, kind, apply) => {
  const [parsed, setParsed] = useState(null);
  const applyRef = useRef(apply);

  applyRef.current = apply;

  useEffect(() => {
    if (!text || text.trim().length < 3) {
      setParsed(null);

      return undefined;
    }

    const timer = setTimeout(() => {
      const result = parseNatural(text, { kind });

      if (!result.understood) {
        setParsed(null);

        return;
      }

      setParsed(result);
      applyRef.current(result);
    }, 700);

    return () => clearTimeout(timer);
  }, [text, kind]);

  return parsed;
};
