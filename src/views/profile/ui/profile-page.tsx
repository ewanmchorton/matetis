"use client";

import Link from "next/link";

import { ElementBadge, getElements } from "@/entities/element";
import { getPersonType } from "@/entities/person-type";
import { progressActions, useProgress } from "@/entities/progress";
import { routes } from "@/shared/config/routes";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button, buttonVariants } from "@/shared/ui/button";
import { StudentStats } from "@/widgets/student-stats";

export function ProfilePage() {
  const { typeId } = useProgress();
  const type = getPersonType(typeId ?? "t1");

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback className="text-lg">АС</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold">Анна Смирнова</h1>
          <p className="text-sm text-muted-foreground">В программе с 23 сентября</p>
        </div>
      </div>

      <section className="space-y-3 rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Мой тип · №{type?.number}
            </p>
            <h2 className="text-xl font-semibold">{type?.name}</h2>
          </div>
          <Link
            href={routes.typeTest}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Пройти тест заново
          </Link>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{type?.description}</p>
      </section>

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

      <div className="border-t pt-6">
        <Button variant="ghost" size="sm" onClick={() => progressActions.reset()}>
          Сбросить демо-отметки
        </Button>
      </div>
    </div>
  );
}
