import { Download, FileText, Headphones, PlayCircle } from "lucide-react";

import { getMaterials, type Material } from "@/entities/material";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

const icons: Record<Material["format"], typeof FileText> = {
  PDF: FileText,
  Аудио: Headphones,
  Видео: PlayCircle,
};

export function LibraryMaterialsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Материалы"
        description="Памятки, записи эфиров и аудио от Мастера"
      />
      <ul className="grid gap-3 sm:grid-cols-2">
        {getMaterials().map((m) => {
          const Icon = icons[m.format];
          return (
            <li key={m.id} className="flex gap-4 rounded-xl border bg-card p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium leading-snug">{m.title}</p>
                <p className="text-sm text-muted-foreground">{m.description}</p>
                <p className="text-xs text-muted-foreground">
                  {m.format} · {m.size}
                </p>
              </div>
              <Button variant="ghost" size="icon" aria-label={m.format === "PDF" ? "Скачать" : "Открыть"}>
                {m.format === "PDF" ? <Download /> : <PlayCircle />}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
