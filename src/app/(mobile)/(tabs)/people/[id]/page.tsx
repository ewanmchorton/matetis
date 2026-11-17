import { people } from "@/entities/social";
import { isStaticPrototype } from "@/shared/config/env";
import { PersonPage } from "@/views/person";

// На GitHub Pages нет сервера: страницы собираются заранее для демо-людей, в приложении – любой человек по его id.
export function generateStaticParams() {
  return isStaticPrototype ? people.map((person) => ({ id: person.id })) : [];
}

export default async function Page({ params }: PageProps<"/people/[id]">) {
  const { id } = await params;
  return <PersonPage personId={id} />;
}
