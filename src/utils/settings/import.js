import { toast } from 'react-toastify';
import variables from 'config/variables';

/**
 * Overwrites localStorage with the given settings JSON; `initial` skips the
 * stats event.
 */
export function importSettings(e, initial = false) {
  const content = JSON.parse(e);

  Object.keys(content).forEach((key) => {
    localStorage.setItem(key, content[key]);
  });

  toast(variables.getMessage('toasts.imported'));
  if (!initial) {
    variables.stats.postEvent('tab', 'Settings imported');
  }
}
