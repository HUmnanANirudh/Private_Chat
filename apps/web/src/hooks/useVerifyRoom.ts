import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@repo/api-client";

export function useVerifyRoom(roomId: string) {
  const navigate = useNavigate();

  const { data, isPending: isVerifying } = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      try {
        return await api.getRoom(roomId);
      } catch (err: any) {
        console.error("[Chat] Room fetch failed", err);
        if (err.response?.status === 404) {
          navigate({ to: "/error/room-not-found" });
        } else {
          navigate({ to: "/error" });
        }
        throw err;
      }
    },
    enabled: !!roomId,
    retry: false,
  });

  const expiresAt = data?.Data?.meta?.expiresAt ? parseInt(data.Data.meta.expiresAt) : null;

  return { expiresAt, isVerifying };
}
