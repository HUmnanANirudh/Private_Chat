export function useRoomToken(roomId: string) {
  const ensureToken = async (): Promise<string | null> => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    if (urlToken) {
      sessionStorage.setItem("token", urlToken);
      return urlToken;
    }

    try {
      const res = await fetch(`/api/v1/room/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          sessionStorage.setItem("token", data.token);
          return data.token;
        }
      } else if (res.status === 403) {
        throw new Error("Room is full");
      }
    } catch (e) {
      console.error("[Chat] Failed to join via API", e);
      throw e;
    }
    return null;
  };

  return { ensureToken };
}
