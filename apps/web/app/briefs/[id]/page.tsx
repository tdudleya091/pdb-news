import { getBriefById } from "@/lib/db/queries";
import { BriefView } from "@/components/BriefView";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function BriefPage({ params }: Props) {
  const brief = await getBriefById(params.id);

  if (!brief) {
    notFound();
  }

  return <BriefView brief={brief} />;
}
