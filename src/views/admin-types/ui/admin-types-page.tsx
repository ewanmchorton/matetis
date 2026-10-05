"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { getPersonTypes, TypeTraits, type PersonType } from "@/entities/person-type";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PageHeader } from "@/shared/ui/page-header";
import { Textarea } from "@/shared/ui/textarea";

export function AdminTypesPage() {
  const [types, setTypes] = useState<PersonType[]>(getPersonTypes);
  const [editing, setEditing] = useState<PersonType | null>(null);

  const save = () => {
    if (!editing) return;
    setTypes(types.map((t) => (t.id === editing.id ? editing : t)));
    setEditing(null);
  };

  return (
    <>
      <PageHeader
        title="12 типов"
        description="Психотипы из черновика Мастера: название, тестовый код и качественные характеристики"
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {types.map((t) => (
          <div key={t.id} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">
                  Тип №{t.number} · код {t.code}
                </p>
                <p className="font-semibold">{t.name}</p>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label="Редактировать" onClick={() => setEditing(t)}>
                <Pencil />
              </Button>
            </div>
            <TypeTraits type={t} />
          </div>
        ))}
      </div>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Тип №{editing?.number}</DialogTitle>
            <DialogDescription>В прототипе изменения живут до перезагрузки страницы.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type-name">Название</Label>
                <Input
                  id="type-name"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type-traits">Качественные характеристики (через запятую)</Label>
                <Input
                  id="type-traits"
                  value={editing.traits.join(", ")}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      traits: e.target.value.split(",").map((x) => x.trim()).filter(Boolean),
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type-desc">Развёрнутое описание</Label>
                <Textarea
                  id="type-desc"
                  rows={6}
                  value={editing.description ?? ""}
                  placeholder="Появится позже"
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Отмена
            </Button>
            <Button onClick={save}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
