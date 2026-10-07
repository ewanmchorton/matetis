import { people } from "@/entities/social";
import { PersonPage } from "@/views/person";

export function generateStaticParams() {
  return people.map((person) => ({ id: person.id }));
}

export const dynamicParams = false;

export default function Page() {
  return <PersonPage />;
}
