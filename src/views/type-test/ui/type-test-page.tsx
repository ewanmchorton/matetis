import { getTypeTest } from "@/entities/type-test";
import { TypeTestFlow } from "@/features/take-type-test";

export function TypeTestPage() {
  return <TypeTestFlow test={getTypeTest()} />;
}
