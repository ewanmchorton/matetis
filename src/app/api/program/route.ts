// Программа человека на сегодня: практики, отметки, навигатор, буквы недели.
import { getMyProgram } from "@/entities/program/server";
import { withPaidUser } from "@/shared/api/route-helpers";

export async function GET() {
  return withPaidUser((user) => getMyProgram(user.id));
}
