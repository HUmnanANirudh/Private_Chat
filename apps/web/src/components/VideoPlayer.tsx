// VideoPlayer - Displays a video stream
import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
  autoPlay?: boolean;
}

export function VideoPlayer({ stream, muted = false, className = "", autoPlay = true }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      if (autoPlay) {
        videoRef.current.play().catch(err => {
          console.error("Autoplay blocked by browser:", err);
        });
      }
    }
  }, [stream, autoPlay, muted]);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        className={`w-full h-full bg-zinc-900 ${className}`}
      />
    </div>
  );
}