import { notFound } from "next/navigation";
import CoverFlow from "@/components/CoverFlow";
import CrateHeader from "@/components/CrateHeader";
import ShuffleControl from "@/components/ShuffleControl";
import { getByYear, getYears } from "@/lib/records";

export function generateStaticParams() {
  return getYears().map((y) => ({ year: String(y) }));
}

export default async function YearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const albums = getByYear(Number(year));
  if (albums.length === 0) notFound();

  return (
    <main className="flex flex-1 flex-col">
      <CrateHeader
        title={year}
        subtitle={`${albums.length} record${albums.length === 1 ? "" : "s"} from ${year}`}
      />
      <CoverFlow albums={albums} />
      <ShuffleControl albums={albums} />
    </main>
  );
}
