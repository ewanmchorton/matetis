import { getTestQuestions } from "@/entities/type-test";
import { TypeTestFlow } from "@/features/take-type-test";
import { routes } from "@/shared/config/routes";
import { Logo } from "@/shared/ui/logo";

export function TypeTestPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-8 px-5 py-8">
      <Logo href={routes.welcome} />
      <TypeTestFlow questions={getTestQuestions()} />
    </main>
  );
}
