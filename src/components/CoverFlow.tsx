"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import { type Album } from "@/lib/records";
import { assetPath } from "@/lib/asset";
import AlbumDetail from "./AlbumDetail";
import PreviewButton from "./PreviewButton";

import "swiper/css";
import "swiper/css/effect-coverflow";

type Variant = "full" | "compact" | "tablet";

// The signature fanned cover-flow. `full` is the screen-filling flow used by the
// curated collections; `compact` is a shorter strip (smaller slides, trimmer
// caption) for the home Spotlight; `tablet` is `full` given an iPad's room —
// the same hinge at roughly twice the cover size, which is the whole reason to
// build a tablet version at all. It is no longer the default for big lists —
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
  const tablet = variant === "tablet";
  const active = albums[Math.min(activeIndex, albums.length - 1)];
  const slideWidth = compact
    ? "min(46vw, 11rem)"
    : tablet
      ? "min(44vw, 26rem)"
      : "min(68vw, 16rem)";

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
        className={`w-full ${compact ? "py-2" : tablet ? "py-12" : "py-10"}`}
      >
        {albums.map((album, index) => (
          <SwiperSlide key={album.id} style={{ width: slideWidth }}>
            <div className="relative">
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

              {/* Only on the slide you're actually looking at — the fanned
                  neighbours are rotated and half-occluded, and a play button on
                  each would clutter the hinge. */}
              {index === activeIndex && album.preview && (
                <PreviewButton
                  key={album.id}
                  url={album.preview.url}
                  track={album.preview.track}
                  size={compact ? "sm" : tablet ? "lg" : "md"}
                />
              )}
            </div>
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
        <div
          className={`mt-5 flex flex-col items-center px-6 text-center ${
            tablet ? "h-40" : "h-32"
          }`}
        >
          <p
            className={`line-clamp-2 font-display leading-snug ${
              tablet ? "text-3xl" : "text-xl"
            }`}
          >
            {active.title}
          </p>
          <p className={`mt-1 text-accent ${tablet ? "text-lg" : ""}`}>
            {active.artist}
          </p>
          {active.edition && (
            <p
              className={`mx-auto mt-2 italic leading-snug text-muted ${
                tablet ? "max-w-md text-base" : "max-w-xs text-sm"
              }`}
            >
              {active.edition}
            </p>
          )}
        </div>
      )}

      {selected && (
        <AlbumDetail
          album={selected}
          wide={tablet}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
