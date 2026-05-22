import { useCallback, useEffect, useMemo, useState } from "react";
import { activityList } from "../lib/clarityIndexedDb";
import { listTillShiftsForBusinessDate } from "../lib/posShift";
import { todayBusinessDate, formatBusinessDateLabel } from "../lib/reporting/businessDate";

export function useStaffManagement({ onNotify } = {}) {
  const [loading, setLoading] = useState(true);
  const [businessDate, setBusinessDate] = useState(todayBusinessDate());
  const [activities, setActivities] = useState([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const activityRows = await activityList(500);
      setActivities(activityRows);
    } catch (e) {
      onNotify?.(e.message || "Unable to load staff data.", "error");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const tillShifts = useMemo(
    () => listTillShiftsForBusinessDate(businessDate),
    [businessDate]
  );

  return {
    loading,
    businessDate,
    setBusinessDate,
    businessDateLabel: formatBusinessDateLabel(businessDate),
    activities,
    tillShifts,
    refresh,
  };
}
