import { notFound } from "next/navigation";

import { getPractice, getPractices } from "@/entities/practice";
import { PracticeDetailPage } from "@/views/practice-detail";

export function generateStaticParams() {
  return getPractices().map((p) => ({ id: p.id }));
}

export default async function Page({ params }: PageProps<"/practice/[id]">) {
  const { id } = await params;
  const practice = getPractice(id);
  if (!practice) notFound();
  return <PracticeDetailPage practice={practice} />;
}
