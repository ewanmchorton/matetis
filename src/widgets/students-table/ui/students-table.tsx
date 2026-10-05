"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Users } from "lucide-react";

import { getPersonType } from "@/entities/person-type";
import type { Student } from "@/entities/student";
import { routes } from "@/shared/config/routes";
import { formatDate } from "@/shared/lib/format-date";
import { EmptyState } from "@/shared/ui/empty-state";
import { Input } from "@/shared/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

export function StudentsTable({ students }: { students: Student[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = students.filter(
    (s) => !q || `${s.name} ${s.email}`.toLowerCase().includes(q),
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Имя или e-mail"
          className="pl-9"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Users} title="Ученики не найдены" />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ученик</TableHead>
                <TableHead className="hidden sm:table-cell">Тип</TableHead>
                <TableHead className="text-right">Практики</TableHead>
                <TableHead className="hidden text-right md:table-cell">Ритуалы</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Активность</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link href={routes.admin.student(s.id)} className="font-medium hover:underline">
                      {s.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {s.typeId ? getPersonType(s.typeId)?.name : (
                      <span className="text-muted-foreground">тест не пройден</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.practicesDone}/{s.practicesTotal}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {s.ritualsDone}/{s.ritualsTotal}
                  </TableCell>
                  <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
                    {formatDate(s.lastActiveAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
