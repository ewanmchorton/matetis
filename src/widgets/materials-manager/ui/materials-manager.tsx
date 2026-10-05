import { Pencil, Upload } from "lucide-react";

import { getMaterials } from "@/entities/material";
import { Button } from "@/shared/ui/button";

export function MaterialsManager() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Памятки, аудио и записи эфиров</p>
        <Button>
          <Upload /> Добавить материал
        </Button>
      </div>
      <ul className="divide-y rounded-xl border bg-card">
        {getMaterials().map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-medium">{m.title}</p>
              <p className="text-xs text-muted-foreground">
                {m.format} · {m.size}
              </p>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Редактировать">
              <Pencil />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
