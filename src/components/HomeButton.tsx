import Link from "next/link";
import { assetPath } from "@/lib/asset";

// The header navigation chip. Every page's top-left control returns to the
// homepage (not browser-back), rendered as the hand-drawn cardboard "home"
// coaster so it matches the shuffle/details chips.
export default function HomeButton() {
  return (
    <Link
      href="/"
      aria-label="Home"
      className="flex h-11 w-11 items-center justify-center transition [filter:drop-shadow(0_3px_6px_rgba(0,0,0,0.55))] active:scale-90"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={assetPath("/ui/home.png")}
        alt=""
        draggable={false}
        className="h-full w-full select-none object-contain"
      />
    </Link>
  );
}
