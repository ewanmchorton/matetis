// Карточка ученика для администратора: данные, расчёт по дате рождения, история теста.
import { getBirthReadingForAdmin } from "@/entities/birth-reading/server";
import { getStudentForAdmin } from "@/entities/student/server";
import { getTypeTestHistoryForAdmin } from "@/entities/type-test-attempt/server";
import { withUser } from "@/shared/api/route-helpers";
import { AppError } from "@/shared/lib/app-error";

export async function GET(_request: Request, { params }: RouteContext<"/api/admin/students/[id]">) {
  const { id } = await params;
  return withUser(async (user) => {
    const person = await getStudentForAdmin(user.id, id);
    if (!person) throw new AppError("not_found", "Такого человека нет");
    const [birthReading, typeHistory] = await Promise.all([
      getBirthReadingForAdmin(user.id, id),
      getTypeTestHistoryForAdmin(user.id, id),
    ]);
    return { person, birthReading, typeHistory };
  });
}
