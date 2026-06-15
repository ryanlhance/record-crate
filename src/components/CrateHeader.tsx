import Link from "next/link";

export default function CrateHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="flex items-center gap-3 px-5 pt-5">
      <Link
        href="/"
        aria-label="Back to home"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-lg transition active:scale-90"
      >
        ←
      </Link>
      <div className="min-w-0">
        <h1 className="truncate font-display text-xl leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
    </header>
  );
}
