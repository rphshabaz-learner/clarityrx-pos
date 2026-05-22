import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const queryKeys = {
  packagingQueue: ["packagingQueue"] as const,
  followUps: ["followUps"] as const,
  posPickups: ["posPickups"] as const,
};
