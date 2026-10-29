import { useEffect, useRef, useState } from 'react';

import { parseNatural } from './natural';

/**
 * Parses the title shortly after typing stops, then hands the result to the dialog so the
 * other fields can follow. The delay keeps it from filling a date mid-word.
 */
export const useNaturalTitle = (text, kind, apply, { enabled = true, ...options } = {}) => {
  const [parsed, setParsed] = useState({ text: '', value: null });
  const applyRef = useRef(apply);
  const optionKey = JSON.stringify(options);

  useEffect(() => {
    applyRef.current = apply;
  }, [apply]);

  useEffect(() => {
    if (!enabled || !text || text.trim().length < 3) {
      return undefined;
    }

    const timer = setTimeout(() => {
      const result = parseNatural(text, { kind, ...JSON.parse(optionKey) });

      if (!result.understood) {
        setParsed({ text, value: null });

        return;
      }

      setParsed({ text, value: result });
      applyRef.current(result);
    }, 700);

    return () => clearTimeout(timer);
  }, [text, kind, enabled, optionKey]);

  return {
    parsed: enabled && parsed.text === text ? parsed.value : null,
    read: () => {
      if (!enabled) return null;
      const result = parseNatural(text, { kind, ...options });
      return result.understood ? result : null;
    },
  };
};
