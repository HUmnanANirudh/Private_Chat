import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../services/apiClient";

export function useVerifyRoom(roomId: string) {
  const navigate = useNavigate();

  const { data, isPending: isVerifying } = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/api/v1/room?roomId=${roomId}`);
        return response.data;
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
