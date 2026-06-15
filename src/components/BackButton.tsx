"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Go back"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      }}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-lg transition active:scale-90"
    >
      ←
    </button>
  );
}
