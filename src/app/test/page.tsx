import { TypeTestPage } from "@/views/type-test";

export default async function Page({ searchParams }: PageProps<"/test">) {
  const { variant } = await searchParams;
  return <TypeTestPage variant={variant === "page" ? "page" : "steps"} />;
}
