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
      <p className="px-6 py-20 text-center text-muted">
        Nothing here yet.
      </p>
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
        coverflowEffect={{
          rotate: 45,
          stretch: 0,
          depth: 140,
          modifier: 1,
          slideShadows: true,
        }}
        onSwiper={setSwiper}
        onSlideChange={(s) => setActiveIndex(s.activeIndex)}
        className="w-full py-10"
      >
        {albums.map((album, index) => (
          <SwiperSlide
            key={album.id}
            style={{ width: "min(70vw, 17rem)" }}
            onClick={() => {
              if (index === activeIndex) setSelected(album);
              else swiper?.slideTo(index);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetPath(album.cover)}
              alt={`${album.title} by ${album.artist}`}
              loading="lazy"
              draggable={false}
              className="aspect-square w-full rounded-lg object-cover shadow-2xl select-none"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Caption for the centered record */}
      <div className="px-6 pb-2 text-center">
        <p className="text-xl font-semibold leading-tight">{active.title}</p>
        <p className="text-accent">{active.artist}</p>
      </div>
      <button
        onClick={() => setSelected(active)}
        className="mt-2 rounded-full border border-white/20 px-5 py-2 text-sm text-muted transition active:scale-95"
      >
        Tap for details
      </button>

      {selected && (
        <AlbumDetail album={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
