export function useClipboardCopy() {
  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      alert("Link copied to clipboard!");
    } catch (e) {
      console.error("Copy failed", e);
      alert("Could not copy link. Your browser may require HTTPS for this feature.");
    }
  };

  return { handleCopy };
}
