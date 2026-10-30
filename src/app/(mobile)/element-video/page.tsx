import { ElementVideoPage } from "@/views/element-video";
import { AccessGate } from "@/widgets/access-gate";

export default function Page() {
  return (
    <AccessGate>
      <ElementVideoPage />
    </AccessGate>
  );
}
