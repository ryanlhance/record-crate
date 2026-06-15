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
          <SwiperSlide
            key={album.id}
            style={{ width: "min(68vw, 16rem)" }}
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
              className="aspect-square w-full select-none rounded-xl object-cover shadow-2xl"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Caption for the centered record */}
      <div className="mt-4 px-6 pb-12 text-center">
        <p className="text-base font-bold uppercase leading-snug tracking-wide">
          {active.title}
        </p>
        <p className="mt-1 text-accent">{active.artist}</p>
      </div>

      {selected && (
        <AlbumDetail album={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
