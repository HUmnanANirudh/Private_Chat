import { useState, useRef, useEffect } from "react";
import { Paperclip, Image, Video, FileText, Music, X } from "lucide-react";
import type { AttachmentMenuProps } from "@repo/types";
export default function AttachmentMenu({ disabled, onFileChange }: AttachmentMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClick = (ref: React.RefObject<HTMLInputElement | null>) => {
    setIsOpen(false);
    ref.current?.click();
  };

  return (
    <div className="relative" ref={menuRef}>
      <input type="file" accept="image/*" className="hidden" ref={imageRef} onChange={onFileChange} />
      <input type="file" accept="video/*" className="hidden" ref={videoRef} onChange={onFileChange} />
      <input type="file" accept="audio/*" className="hidden" ref={audioRef} onChange={onFileChange} />
      <input type="file" accept="*/*" className="hidden" ref={docRef} onChange={onFileChange} />

      {isOpen && (
        <div className="absolute bottom-[calc(100%+0.5rem)] left-0 z-50 mb-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex flex-col p-1.5">
            <button
              onClick={() => handleClick(imageRef)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-md">
                <Image size={16} />
              </div>
              Image
            </button>
            <button
              onClick={() => handleClick(videoRef)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-md">
                <Video size={16} />
              </div>
              Video
            </button>
            <button
              onClick={() => handleClick(audioRef)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <div className="p-1.5 bg-green-500/10 text-green-400 rounded-md">
                <Music size={16} />
              </div>
              Audio
            </button>
            <button
              onClick={() => handleClick(docRef)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <div className="p-1.5 bg-orange-500/10 text-orange-400 rounded-md">
                <FileText size={16} />
              </div>
              Document
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`p-3.5 sm:p-4 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-stretch flex items-center justify-center rounded-l-2xl ${isOpen ? "text-zinc-100 bg-zinc-800" : "text-zinc-400"}`}
        title="Attach file"
      >
        {isOpen ? <X size={20} /> : <Paperclip size={20} />}
      </button>
    </div>
  );
}
