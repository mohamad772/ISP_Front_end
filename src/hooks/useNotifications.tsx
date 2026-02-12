import { useQuery } from "@tanstack/react-query";
import { getMyNotifications } from "@/service/notifications.service";
import { Notification } from "@/types/api.types";

export const notificationKeys = {
  all: ["notifications"] as const,
  me: (limit?: number) => [...notificationKeys.all, "me", { limit }] as const,
};

export function useNotifications(limit?: number) {
  return useQuery<Notification[], Error>({
    queryKey: notificationKeys.me(limit),
    queryFn: () => getMyNotifications(limit),
  });
}
