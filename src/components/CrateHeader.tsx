import HomeButton from "./HomeButton";

export default function CrateHeader({
  title,
  subtitle,
  sticky = false,
}: {
  title: string;
  subtitle?: string;
  /** On long grid pages, keep the title/back reachable while scrolling. */
  sticky?: boolean;
}) {
  return (
    <header
      className={`relative px-16 pb-2 pt-5 text-center ${
        sticky ? "sticky top-0 z-30 bg-background/90 backdrop-blur" : ""
      }`}
    >
      <div className="absolute left-4 top-4">
        <HomeButton />
      </div>
      <h1 className="font-display text-xl font-semibold leading-tight">
        {title}
      </h1>
      {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
    </header>
  );
}
