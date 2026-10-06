import { ElementResultPage } from "@/views/element-result";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ badge?: string | string[] }>;
}) {
  const params = await searchParams;
  return <ElementResultPage earned={params.badge !== "0"} />;
}
