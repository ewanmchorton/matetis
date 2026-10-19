// Список учеников для администратора.
import { listStudentsForAdmin } from "@/entities/student/server";
import { withUser } from "@/shared/api/route-helpers";

export async function GET() {
  return withUser((user) => listStudentsForAdmin(user.id));
}
