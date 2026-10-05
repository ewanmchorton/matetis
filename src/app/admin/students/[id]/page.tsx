import { notFound } from "next/navigation";

import { getStudent, getStudents } from "@/entities/student";
import { AdminStudentDetailPage } from "@/views/admin-student-detail";

export function generateStaticParams() {
  return getStudents().map((s) => ({ id: s.id }));
}

export default async function Page({ params }: PageProps<"/admin/students/[id]">) {
  const { id } = await params;
  const student = getStudent(id);
  if (!student) notFound();
  return <AdminStudentDetailPage student={student} />;
}
