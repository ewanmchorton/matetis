"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { PhrasesEditor } from "@/features/manage-phrases";
import { PracticesEditor } from "@/features/manage-practices";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";

const tabs = [
  { id: "daily", label: "Ежедневные" },
  { id: "weekly", label: "Еженедельные" },
  { id: "awareness", label: "Осознания" },
  { id: "phrases", label: "Фразы дня" },
] as const;

type Tab = (typeof tabs)[number]["id"];

/** Раздел «Практики»: ежедневные, еженедельные, осознания и фразы дня. Вкладка запоминается в адресе. */
export function AdminPracticesPage() {
  const router = useRouter();
  const fromUrl = useSearchParams().get("tab");
  const tab: Tab = tabs.some((item) => item.id === fromUrl) ? (fromUrl as Tab) : "daily";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-semibold">Практики</h1>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Виды практик">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => router.replace(`${routes.adminPractices}?tab=${item.id}`)}
            className={cn(
              "min-h-11 rounded-full border px-4 text-sm",
              tab === item.id ? "border-primary bg-primary/10 text-primary" : "bg-background text-muted-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "daily" && <PracticesEditor frequency="daily" />}
      {tab === "weekly" && <PracticesEditor frequency="weekly" />}
      {tab === "awareness" && (
        <p className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground">
          Два осознания: по книге «2 жизни» и на слабую стихию. Как они подбираются человеку, уточняем у Жанны — после
          ответа здесь появится их заполнение.
        </p>
      )}
      {tab === "phrases" && <PhrasesEditor />}
    </div>
  );
}
