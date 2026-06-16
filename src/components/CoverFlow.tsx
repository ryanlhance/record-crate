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

export default function CoverFlow({ albums }: { albums: Album[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiper, setSwiper] = useState<SwiperClass | null>(null);
  const [selected, setSelected] = useState<Album | null>(null);

  if (albums.length === 0) {
    return (
      <p className="px-6 py-20 text-center text-muted">Nothing here yet.</p>
    );
  }

  const active = albums[Math.min(activeIndex, albums.length - 1)];

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
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
        className="w-full py-10"
      >
        {albums.map((album, index) => (
          <SwiperSlide key={album.id} style={{ width: "min(68vw, 16rem)" }}>
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

      {selected && (
        <AlbumDetail album={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
