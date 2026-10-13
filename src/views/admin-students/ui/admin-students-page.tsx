import { getPersonType } from "@/entities/person-type";
import { getStudents } from "@/entities/student";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

export function AdminStudentsPage() {
  const students = getStudents();

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Ученики</h1>
        <p className="text-sm text-muted-foreground">
          Демо-список. Когда появится сервер, здесь будут настоящие регистрации.
        </p>
      </div>

      <section className="rounded-2xl border bg-background p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Имя</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Регистрация</TableHead>
              <TableHead className="text-right">Практик на неделе</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => {
              const type = getPersonType(s.typeId);
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.email}</TableCell>
                  <TableCell>{type ? `${type.number}. ${type.name}` : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(s.registeredAt)}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.practicesThisWeek}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>
    </>
  );
}
