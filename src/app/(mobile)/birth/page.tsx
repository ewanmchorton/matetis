import { BirthPreviewPage } from "@/views/birth-preview";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const params = await searchParams;
  const view = params.view === "square" ? "square" : "practices";
  return <BirthPreviewPage view={view} />;
}
