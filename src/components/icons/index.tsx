// Icon system. One source per shape, extracted from `design partner/assets/`.
// Functional icons are stroke-only on `currentColor` (matching the original hero
// arrow's DNA: round caps/joins, no fill) so they inherit color on cream, red, or
// dark with zero variants. Decorative icons may use fills.
//
// Pass `title` to give an icon an accessible name; omit it (the default) to mark
// the icon decorative (`aria-hidden`), which is right when adjacent text already
// labels the control.

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function a11y(title?: string) {
  return title
    ? { role: "img" as const, "aria-label": title }
    : { "aria-hidden": true as const, focusable: false as const };
}

/* ---- Functional icons (stroke, currentColor) ---- */

export function ArrowRight({ title, ...props }: IconProps) {
  return (
    <svg width="54" height="28" viewBox="0 0 54 28" fill="none" {...a11y(title)} {...props}>
      <path
        d="M2 14 H49 M38 4 L50 14 L38 24"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowBack({ title, ...props }: IconProps) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" {...a11y(title)} {...props}>
      <path
        d="M25 14 H5 M13 6 L4 14 L13 22"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Close({ title, ...props }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...a11y(title)} {...props}>
      <path
        d="M5 5 L19 19 M19 5 L5 19"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Shuffle({ title, ...props }: IconProps) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" {...a11y(title)} {...props}>
      <path
        d="M3 7 H8 C11 7 12.5 9 14 12.5 C15.5 16 17 19 20 19 H25"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 21 H8 C11 21 12.5 19 13.2 17.4 M16.8 9.4 C17.6 8 19 7 20 7 H25"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21.5 3.5 L25.5 7 L21.5 10.5"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21.5 15.5 L25.5 19 L21.5 22.5"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Sort({ title, ...props }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...a11y(title)} {...props}>
      <path
        d="M7 4 V20 M7 4 L3.5 7.5 M7 4 L10.5 7.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 20 V4 M17 20 L13.5 16.5 M17 20 L20.5 16.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GridFlow({ title, ...props }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...a11y(title)} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="2.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="2.6" />
      <rect x="14" y="3" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="2.6" />
      <rect x="14" y="14" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="2.6" />
    </svg>
  );
}

/* ---- Media transport (filled glyphs — read clearest inside a round button) ---- */

export function Play({ title, ...props }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...a11y(title)} {...props}>
      <path d="M7 4.8 L19 12 L7 19.2 Z" fill="currentColor" strokeLinejoin="round" />
    </svg>
  );
}

export function Pause({ title, ...props }: IconProps) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...a11y(title)} {...props}>
      <rect x="6.5" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" />
      <rect x="13.9" y="5" width="3.6" height="14" rx="1.2" fill="currentColor" />
    </svg>
  );
}

/* ---- Decorative elements (fills allowed) ---- */

export function Vinyl({ title, ...props }: IconProps) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" {...a11y(title)} {...props}>
      <circle cx="24" cy="24" r="22" fill="#1c1b19" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="17.5" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.45" />
      <circle cx="24" cy="24" r="14" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.45" />
      <circle cx="24" cy="24" r="10.5" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.45" />
      <circle cx="24" cy="24" r="7" fill="#cda24a" />
      <circle cx="24" cy="24" r="1.6" fill="#1c1b19" />
    </svg>
  );
}

export function Sparkle({ title, ...props }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" {...a11y(title)} {...props}>
      <path
        d="M11 1 C11.6 6.4 15.6 10.4 21 11 C15.6 11.6 11.6 15.6 11 21 C10.4 15.6 6.4 11.6 1 11 C6.4 10.4 10.4 6.4 11 1 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Squiggle({ title, ...props }: IconProps) {
  return (
    <svg width="120" height="14" viewBox="0 0 120 14" fill="none" {...a11y(title)} {...props}>
      <path
        d="M3 8 C20 3 34 11 52 7 C70 3 86 12 104 6 C110 4 114 7 117 8"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* Hand-drawn marker underline for genre labels (same stroke as Squiggle). */
export function MarkerUnderline({ title, ...props }: IconProps) {
  return (
    <svg width="120" height="14" viewBox="0 0 120 14" fill="none" {...a11y(title)} {...props}>
      <path
        d="M3 8 C20 3 34 11 52 7 C70 3 86 12 104 6 C110 4 114 7 117 8"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DoodleStar({ title, ...props }: IconProps) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" {...a11y(title)} {...props}>
      <path
        d="M13 2 L16 10 L24 10.5 L17.5 15.5 L20 23.5 L13 18.5 L6 23.5 L8.5 15.5 L2 10.5 L10 10 Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function DoodleDisc({ title, ...props }: IconProps) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" {...a11y(title)} {...props}>
      <circle cx="13" cy="13" r="10.5" stroke="currentColor" strokeWidth="2.2" fill="none" />
      <circle cx="13" cy="13" r="2.4" stroke="currentColor" strokeWidth="2.2" fill="none" />
    </svg>
  );
}
