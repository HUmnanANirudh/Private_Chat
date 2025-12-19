"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OverlayModal({
  title,
  description,
  redirectTo = "/",
  seconds = 10,
}: {
  title: string;
  description?: string;
  redirectTo?: string;
  seconds?: number;
}) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft === 0) {
      router.push(redirectTo);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, router, redirectTo]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-zinc-900 border border-zinc-700 p-6 text-center shadow-2xl">
        <h2 className="text-xl font-semibold text-zinc-100">
          {title}
        </h2>

        {description && (
          <p className="mt-2 text-sm text-zinc-400">
            {description}
          </p>
        )}

        <p className="mt-4 text-sm text-zinc-300">
          Redirecting to home in{" "}
          <span className="font-bold text-white">
            {timeLeft}
          </span>{" "}
          seconds
        </p>

        <button
          onClick={() => router.push(redirectTo)}
          className="mt-5 px-4 py-2 bg-zinc-100 text-black font-medium hover:bg-zinc-200"
        >
          Go now
        </button>
      </div>
    </div>
  );
}
