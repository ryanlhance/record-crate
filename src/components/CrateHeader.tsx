import Link from "next/link";

export default function CrateHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="flex items-center gap-4 px-6 pt-6">
      <Link
        href="/"
        aria-label="Back to home"
        className="rounded-full border border-white/15 px-3 py-1 text-sm text-muted transition active:scale-95"
      >
        ← Home
      </Link>
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold leading-tight">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
    </header>
  );
}
