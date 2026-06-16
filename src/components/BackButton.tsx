"use client";

import { useRouter } from "next/navigation";
import { ArrowBack } from "./icons";

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
      className="flex h-10 w-10 items-center justify-center rounded-full bg-card transition active:scale-90"
    >
      <ArrowBack className="h-5 w-5" />
    </button>
  );
}
