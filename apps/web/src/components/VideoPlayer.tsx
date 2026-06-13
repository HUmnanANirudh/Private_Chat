// VideoPlayer - Displays a video stream
import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
  autoPlay?: boolean;
}

export function VideoPlayer({ stream, muted = false, className = "", autoPlay = true }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      if (autoPlay) {
        videoRef.current.play().catch(err => {
          console.error("Autoplay blocked by browser:", err);
          if (!muted) {
            setAutoplayBlocked(true);
          }
        });
      }
    }
  }, [stream, autoPlay, muted]);

  const handleManualPlay = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setAutoplayBlocked(false);
      }).catch(err => console.error(err));
    }
  };

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        className={`w-full h-full bg-zinc-900 ${className}`}
      />
      {autoplayBlocked && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-50">
          <p className="text-white mb-4">Click to enable audio & video playback</p>
          <button 
            onClick={handleManualPlay}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium"
          >
            Play Media
          </button>
        </div>
      )}
    </div>
  );
}