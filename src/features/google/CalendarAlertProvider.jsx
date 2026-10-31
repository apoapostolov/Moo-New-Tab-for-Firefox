import { createContext, useContext } from 'react';
import { useGoogleAuth } from './hooks/useGoogleAuth';
import useCalendarAlerts from './hooks/useCalendarAlerts';

const CalendarAlertContext = createContext({ fired: {}, error: '' });
export const useCalendarAlertState = () => useContext(CalendarAlertContext);

// Delivery must keep syncing even when Calendar is hidden in the current layout.
export default function CalendarAlerts({ children }) {
  const { auth, loading } = useGoogleAuth();
  const state = useCalendarAlerts(loading ? undefined : auth);
  return <CalendarAlertContext.Provider value={state}>{children}</CalendarAlertContext.Provider>;
}
