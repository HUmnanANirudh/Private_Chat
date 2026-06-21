import { useState, useCallback } from "react";

export function useClipboardCopy() {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(async (text: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (e) {
      console.error("Copy failed", e);
    }
  }, []);

  return { handleCopy, isCopied };
}
