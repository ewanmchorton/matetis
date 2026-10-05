import { getStudents } from "@/entities/student";
import { PageHeader } from "@/shared/ui/page-header";
import { StudentsTable } from "@/widgets/students-table";

export function AdminUsersPage() {
  const students = getStudents();
  return (
    <>
      <PageHeader title="Пользователи" description={`Всего: ${students.length}`} />
      <StudentsTable students={students} />
    </>
  );
}
