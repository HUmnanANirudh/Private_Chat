import { useState, useEffect } from "react";

export function useUsername() {
  const [username, setUsername] = useState("Peer");

  useEffect(() => {
    const stored = localStorage.getItem("username");
    if (stored) {
      setUsername(stored);
    }
  }, []);

  return { username, setUsername };
}
