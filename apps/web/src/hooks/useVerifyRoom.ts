import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

export function useVerifyRoom(roomId: string) {
  const navigate = useNavigate();
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const verify = async () => {
      try {
        const roomRes = await fetch(`/api/v1/room?roomId=${roomId}`, { credentials: "include" });
        if (!roomRes.ok) {
          console.error("[Chat] Room fetch failed", roomRes.status);
          if (roomRes.status === 404) {
            navigate({ to: "/error/room-not-found" });
          } else {
            navigate({ to: "/error" });
          }
          return;
        }

        const data = await roomRes.json();
        if (isMounted && data?.Data?.meta?.expiresAt) {
          setExpiresAt(parseInt(data.Data.meta.expiresAt));
        }
      } catch (err) {
        console.error("[Chat] Verification error:", err);
        navigate({ to: "/error" });
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    };

    verify();
    return () => {
      isMounted = false;
    };
  }, [roomId, navigate]);

  return { expiresAt, isVerifying };
}
