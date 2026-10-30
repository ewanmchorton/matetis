import { NavigatorPage } from "@/views/navigator";
import { AccessGate } from "@/widgets/access-gate";

export default function Page() {
  return (
    <AccessGate>
      <NavigatorPage />
    </AccessGate>
  );
}
