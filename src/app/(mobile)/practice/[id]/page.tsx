import { isStaticPrototype } from "@/shared/config/env";
import { PracticePage } from "@/views/practice";
import { AccessGate } from "@/widgets/access-gate";

// На GitHub Pages нет сервера: страницы собираются заранее, а практики хранятся в базе.
// Там собирается одна страница-пример, в приложении — любая практика по её номеру.
export function generateStaticParams() {
  return isStaticPrototype ? [{ id: "example" }] : [];
}

export default async function Page({ params }: PageProps<"/practice/[id]">) {
  const { id } = await params;
  return (
    <AccessGate>
      <PracticePage practiceId={id} />
    </AccessGate>
  );
}
