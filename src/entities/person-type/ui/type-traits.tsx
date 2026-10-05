import type { PersonType } from "../model/types";

export function TypeTraits({ type }: { type: PersonType }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {type.traits.map((t) => (
        <li key={t} className="rounded-full bg-muted px-3 py-1 text-sm">
          {t}
        </li>
      ))}
    </ul>
  );
}
