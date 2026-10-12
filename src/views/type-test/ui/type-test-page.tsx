import { getTypeTest } from "@/entities/type-test";
import { TypeTestFlow } from "@/features/take-type-test";
import { routes } from "@/shared/config/routes";
import { Logo } from "@/shared/ui/logo";

export function TypeTestPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-5 py-6">
      <Logo href={routes.onboarding} />
      <TypeTestFlow test={getTypeTest()} />
    </main>
  );
}
