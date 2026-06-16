"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import { type Album } from "@/lib/records";
import { assetPath } from "@/lib/asset";
import AlbumDetail from "./AlbumDetail";

import "swiper/css";
import "swiper/css/effect-coverflow";

type Variant = "full" | "compact";

// The signature fanned cover-flow. `full` is the screen-filling flow used by the
// curated collections; `compact` is a shorter strip (smaller slides, trimmer
// caption) for the home Spotlight. It is no longer the default for big lists —
// being rarer is the point.
export default function CoverFlow({
  albums,
  variant = "full",
}: {
  albums: Album[];
  variant?: Variant;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiper, setSwiper] = useState<SwiperClass | null>(null);
  const [selected, setSelected] = useState<Album | null>(null);

  if (albums.length === 0) {
    return (
      <p className="px-6 py-20 text-center text-muted">Nothing here yet.</p>
    );
  }

  const compact = variant === "compact";
  const active = albums[Math.min(activeIndex, albums.length - 1)];
  const slideWidth = compact ? "min(46vw, 11rem)" : "min(68vw, 16rem)";

  return (
    <div
      className={`flex flex-col items-center justify-center ${
        compact ? "" : "flex-1"
      }`}
    >
      <Swiper
        modules={[EffectCoverflow]}
        effect="coverflow"
        grabCursor
        centeredSlides
        slidesPerView="auto"
        speed={350}
        coverflowEffect={{
          rotate: 34,
          stretch: 0,
          depth: 110,
          modifier: 1.1,
          scale: 0.95,
          slideShadows: true,
        }}
        onSwiper={setSwiper}
        onActiveIndexChange={(s) => setActiveIndex(s.activeIndex)}
        className={`w-full ${compact ? "py-2" : "py-10"}`}
      >
        {albums.map((album, index) => (
          <SwiperSlide key={album.id} style={{ width: slideWidth }}>
            {/* Real button: tap the active slide to open, tap a side slide to
                center it. aria-label carries the name so the cover img is
                decorative. */}
            <button
              type="button"
              aria-label={`${album.title} by ${album.artist}`}
              onClick={() => {
                if (index === activeIndex) setSelected(album);
                else swiper?.slideTo(index);
              }}
              className="block w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetPath(album.cover)}
                alt=""
                loading="lazy"
                draggable={false}
                className="aspect-square w-full select-none rounded-xl object-cover shadow-2xl"
              />
            </button>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Caption — fixed height so the cover never shifts as you scroll,
          whether or not an album has an edition note. */}
      {compact ? (
        <div className="mt-1 flex h-12 flex-col items-center px-6 text-center">
          <p className="line-clamp-1 font-display text-base leading-tight">
            {active.title}
          </p>
          <p className="mt-0.5 text-sm text-accent">{active.artist}</p>
        </div>
      ) : (
        <div className="mt-5 flex h-32 flex-col items-center px-6 text-center">
          <p className="line-clamp-2 font-display text-xl leading-snug">
            {active.title}
          </p>
          <p className="mt-1 text-accent">{active.artist}</p>
          {active.edition && (
            <p className="mx-auto mt-2 max-w-xs text-sm italic leading-snug text-muted">
              {active.edition}
            </p>
          )}
        </div>
      )}

      {selected && (
        <AlbumDetail album={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
