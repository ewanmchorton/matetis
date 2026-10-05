import { ElementBadge, getElements } from "@/entities/element";
import { StudentStats } from "@/widgets/student-stats";

export function StudentStatsPage() {
  return (
    <div className="space-y-8">
      <StudentStats />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">История стихий</h2>
        <div className="grid gap-2 sm:grid-cols-5">
          {getElements().map((el) => (
            <div key={el.id} className="space-y-2 rounded-xl border bg-card p-3">
              <ElementBadge element={el} />
              <p className="text-xs text-muted-foreground">
                {el.hasContent ? "Идёт сейчас" : "Ещё впереди"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
