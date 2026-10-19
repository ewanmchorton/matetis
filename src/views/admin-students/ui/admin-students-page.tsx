"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getPersonType } from "@/entities/person-type";
import { getStudents } from "@/entities/student";
import { request } from "@/shared/api/request";
import { isStaticPrototype } from "@/shared/config/env";
import { routes } from "@/shared/config/routes";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

type StudentRow = {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  typeName: string | null;
  hasBirthDate: boolean;
};

type ListState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; rows: StudentRow[] };

/** Демо-список для GitHub Pages: там нет сервера. */
function demoRows(): StudentRow[] {
  return getStudents().map((student) => ({
    id: student.id,
    name: student.name,
    email: student.email,
    registeredAt: student.registeredAt,
    typeName: getPersonType(student.typeId)?.name ?? null,
    hasBirthDate: false,
  }));
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export function AdminStudentsPage() {
  const [state, setState] = useState<ListState>({ status: "loading" });

  useEffect(() => {
    if (isStaticPrototype) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ status: "ready", rows: demoRows() });
      return;
    }
    request<StudentRow[]>("/api/admin/students")
      .then((rows) => setState({ status: "ready", rows }))
      .catch((error: Error) => setState({ status: "error", message: error.message }));
  }, []);

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Ученики</h1>
        <p className="text-sm text-muted-foreground">
          {isStaticPrototype
            ? "Демо-список: на этом сайте нет сервера."
            : "Все зарегистрированные люди. Нажмите на имя, чтобы открыть стихии и историю теста."}
        </p>
      </div>

      <section className="rounded-2xl border bg-background p-5">
        {state.status === "loading" && <p className="text-sm text-muted-foreground">Загружаем…</p>}
        {state.status === "error" && (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        )}
        {state.status === "ready" && state.rows.length === 0 && (
          <p className="text-sm text-muted-foreground">Пока никто не зарегистрировался.</p>
        )}
        {state.status === "ready" && state.rows.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Имя</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Дата рождения</TableHead>
                <TableHead>Регистрация</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {isStaticPrototype ? (
                      row.name
                    ) : (
                      <Link
                        href={`${routes.adminStudent}?id=${encodeURIComponent(row.id)}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {row.name}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.email}</TableCell>
                  <TableCell>{row.typeName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{row.hasBirthDate ? "указана" : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(row.registeredAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </>
  );
}
