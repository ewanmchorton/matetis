// Команда в админке: список и назначение роли ({ email, role, password? }). Только для администратора.
import { listStaffForAdmin, setStaffRole } from "@/entities/staff/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

export async function GET() {
  return withUser((user) => listStaffForAdmin(user.id));
}

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  return withUser((user) => setStaffRole(user.id, body));
}
