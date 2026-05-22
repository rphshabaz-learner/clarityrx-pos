import { useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { useAuth } from "../AuthContext";
import { fetchPosPickups } from "../services/posApi";
import { queryClient, queryKeys } from "../lib/queryClient";
import { isPosPickupSyncEnabled, resolvePackagingSocketUrl, resolvePosTransmitApiBaseUrl } from "../lib/apiConfig";

const REALTIME_POS_EVENT = "posPickupQueueUpdated";
const POLL_INTERVAL_MS = 5000;

export function usePosPickups() {
  const { accessToken } = useAuth();
  const socketRef = useRef(null);

  const {
    data: pickups = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...queryKeys.posPickups, accessToken],
    queryFn: () => fetchPosPickups(accessToken),
    enabled: Boolean(accessToken) && isPosPickupSyncEnabled(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const reload = useCallback(async () => {
    if (!accessToken) return;
    await queryClient.invalidateQueries({ queryKey: queryKeys.posPickups });
    return refetch();
  }, [accessToken, refetch]);

  useEffect(() => {
    if (!accessToken || !isPosPickupSyncEnabled()) return undefined;

    const socketUrl = resolvePackagingSocketUrl(resolvePosTransmitApiBaseUrl());
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      auth: { token: accessToken },
    });
    socketRef.current = socket;

    const handleUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.posPickups });
    };

    socket.on(REALTIME_POS_EVENT, handleUpdate);

    const pollTimer = setInterval(() => {
      if (!socket.connected) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.posPickups });
      }
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(pollTimer);
      socket.off(REALTIME_POS_EVENT, handleUpdate);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken]);

  return {
    pickups,
    isLoading,
    error: error?.message || "",
    reload,
  };
}
