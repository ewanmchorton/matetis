"use client";

import { useState } from "react";
import { ImagePlus, Plus, Video } from "lucide-react";

import { getElement } from "@/entities/element";
import {
  getPractices,
  practiceKindLabel,
  type Practice,
  type PracticeKind,
} from "@/entities/practice";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";

const kinds = Object.entries(practiceKindLabel).map(([value, label]) => ({
  value: value as PracticeKind,
  label,
}));

const emptyDraft = { title: "", summary: "", kind: "daily" as PracticeKind, video: "" };

export function AdminPracticesPage() {
  const [practices, setPractices] = useState<Practice[]>(getPractices);
  const [filter, setFilter] = useState<PracticeKind | "all">("all");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  const rows = practices.filter((p) => filter === "all" || p.kind === filter);

  const create = () => {
    setPractices([
      {
        id: `new-${Date.now()}`,
        kind: draft.kind,
        title: draft.title || "Новая практика",
        summary: draft.summary,
        durationMin: 10,
        elementId: draft.kind === "state" ? undefined : "metal",
        typeIds: [],
        steps: [],
        hasImage: false,
        video: draft.video ? { title: draft.title, duration: "—" } : undefined,
      },
      ...practices,
    ]);
    setDraft(emptyDraft);
    setOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Практики и медиа"
        description="Все практики, ритуалы и практики по состоянию"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus /> Новая практика
          </Button>
        }
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as PracticeKind | "all")}>
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="daily">Ежедневные</TabsTrigger>
          <TabsTrigger value="ritual">Ритуалы</TabsTrigger>
          <TabsTrigger value="state">По состоянию</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead className="hidden md:table-cell">Вид</TableHead>
              <TableHead className="hidden sm:table-cell">Стихия / категория</TableHead>
              <TableHead className="hidden lg:table-cell">Типы</TableHead>
              <TableHead className="text-right">Медиа</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="max-w-[16rem] whitespace-normal">
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.durationMin} мин</p>
                </TableCell>
                <TableCell className="hidden md:table-cell">{practiceKindLabel[p.kind]}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {p.elementId ? getElement(p.elementId).name : p.state}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {p.typeIds.length === 0 ? "все 12" : `${p.typeIds.length} из 12`}
                </TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex gap-1.5 text-muted-foreground">
                    {p.hasImage && <ImagePlus className="size-4" aria-label="Есть изображение" />}
                    {p.video && <Video className="size-4" aria-label="Есть видео" />}
                    {!p.hasImage && !p.video && "—"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Новая практика</DialogTitle>
            <DialogDescription>
              В прототипе практика добавится в список до перезагрузки страницы.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="p-title">Название</Label>
              <Input
                id="p-title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Например, «Утреннее дыхание»"
              />
            </div>
            <div className="grid gap-2">
              <Label>Вид</Label>
              <Select
                items={kinds}
                value={draft.kind}
                onValueChange={(v) => v && setDraft({ ...draft, kind: v as PracticeKind })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {kinds.map((k) => (
                    <SelectItem key={k.value} value={k.value}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-summary">Описание</Label>
              <Textarea
                id="p-summary"
                rows={4}
                value={draft.summary}
                onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="p-video">Ссылка на видео</Label>
              <Input
                id="p-video"
                value={draft.video}
                onChange={(e) => setDraft({ ...draft, video: e.target.value })}
                placeholder="https://…"
              />
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <ImagePlus className="size-5" />
              Перетащите изображения сюда (загрузка появится в рабочей версии)
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button onClick={create}>Добавить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
