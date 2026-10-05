import { ElementBadge, getElements } from "@/entities/element";
import { PageHeader } from "@/shared/ui/page-header";
import { ElementGuide } from "@/widgets/element-guide";

export function ProgramRecommendationsPage() {
  const upcoming = getElements().filter((e) => !e.hasContent);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Рекомендации стихии"
        description="Видео Мастера, книги и фильмы на текущую стихию"
      />
      <ElementGuide />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Следующие стихии</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {upcoming.map((el) => (
            <div key={el.id} className="space-y-2 rounded-xl border border-dashed p-4">
              <ElementBadge element={el} />
              <p className="text-sm text-muted-foreground">
                {el.season}, {el.period}. Рекомендации откроются с началом стихии.
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
