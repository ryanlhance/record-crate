import BackButton from "./BackButton";

export default function CrateHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="relative px-16 pb-2 pt-5 text-center">
      <div className="absolute left-4 top-5">
        <BackButton />
      </div>
      <h1 className="font-display text-xl font-semibold leading-tight">
        {title}
      </h1>
      {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
    </header>
  );
}
