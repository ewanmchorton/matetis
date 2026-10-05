"use client";

import Link from "next/link";

import { getPersonType, TypeTraits } from "@/entities/person-type";
import { useProgress } from "@/entities/progress";
import { routes } from "@/shared/config/routes";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { buttonVariants } from "@/shared/ui/button";

export function ProfileTypePage() {
  const { typeId } = useProgress();
  const type = getPersonType(typeId ?? "t1");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback className="text-lg">АС</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold">Анна Смирнова</h1>
          <p className="text-sm text-muted-foreground">В программе с 23 сентября</p>
        </div>
      </div>

      {type && (
        <section className="space-y-4 rounded-2xl border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Мой психотип · №{type.number}
              </p>
              <h2 className="text-2xl font-semibold">{type.name}</h2>
            </div>
            <Link
              href={routes.typeTest}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Пройти тест заново
            </Link>
          </div>
          <TypeTraits type={type} />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {type.description ??
              "Развёрнутое описание типа появится позже — Мастер добавит его в кабинете администратора."}
          </p>
        </section>
      )}
    </div>
  );
}
