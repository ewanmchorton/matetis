import { TogetherPage } from "@/views/together";

export default async function Page({ searchParams }: PageProps<"/together">) {
  const { friend } = await searchParams;
  return <TogetherPage friendId={typeof friend === "string" ? friend : undefined} />;
}
