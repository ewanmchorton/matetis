import { notFound } from "next/navigation";

import { getStudent, getStudents } from "@/entities/student";
import { AdminUserDetailPage } from "@/views/admin-user-detail";

export function generateStaticParams() {
  return getStudents().map((s) => ({ id: s.id }));
}

export default async function Page({ params }: PageProps<"/admin/users/[id]">) {
  const { id } = await params;
  const student = getStudent(id);
  if (!student) notFound();
  return <AdminUserDetailPage student={student} />;
}
