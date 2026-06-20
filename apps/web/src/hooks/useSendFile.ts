import type { UseSendFileProps } from "@repo/types";

export function useSendFile({
  username,
  chatManagerRef,
  setMessages,
}: UseSendFileProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && chatManagerRef.current) {
      const messageId = crypto.randomUUID();
      
      setMessages((prev) => [
        ...prev,
        {
          id: messageId,
          content: `Sending file: ${file.name}... (Please wait)`,
          sender: "You",
          timestamp: Date.now(),
          isOwn: true,
          isFile: false,
          isSending: true,
          fileName: file.name,
        },
      ]);

      const success = await chatManagerRef.current.sendFile(file, username);
      
      if (success) {
        setMessages((prev) => prev.map(msg => 
          msg.id === messageId ? {
            ...msg,
            content: `Sent file: ${file.name}`,
            isFile: true,
            isSending: false,
            fileName: file.name,
          } : msg
        ));
      } else {
        setMessages((prev) => prev.map(msg => 
          msg.id === messageId ? {
            ...msg,
            content: `Failed to send file: ${file.name}`,
            isSending: false,
          } : msg
        ));
      }
    }
    if (e.target) e.target.value = "";
  };

  return { handleFileChange };
}
