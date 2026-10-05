import { PageHeader } from "@/shared/ui/page-header";
import { WeeklyRituals } from "@/widgets/weekly-rituals";

export function ProgramRitualsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Еженедельные ритуалы"
        description="Ритуалы повторяются каждую неделю. Отметьте выполнение галочкой — отметки обнуляются в понедельник."
      />
      <WeeklyRituals />
      <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        Можно ли отмечать ритуалы задним числом и в какие дни их лучше выполнять — уточняем у
        Мастера.
      </p>
    </div>
  );
}
