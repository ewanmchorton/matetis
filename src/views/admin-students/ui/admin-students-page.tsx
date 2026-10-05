import { getStudents } from "@/entities/student";
import { PageHeader } from "@/shared/ui/page-header";
import { StudentsTable } from "@/widgets/students-table";

export function AdminStudentsPage() {
  const students = getStudents();
  return (
    <>
      <PageHeader title="Ученики" description={`Всего: ${students.length}`} />
      <StudentsTable students={students} />
    </>
  );
}
