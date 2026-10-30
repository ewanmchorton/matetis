import { PracticePage } from "@/views/practice";
import { AccessGate } from "@/widgets/access-gate";

export default async function Page({ params }: PageProps<"/practice/[id]">) {
  const { id } = await params;
  return (
    <AccessGate>
      <PracticePage practiceId={id} />
    </AccessGate>
  );
}
