// Разделы библиотеки для админки: стихии, практики и книги.
import { libraryCatalogForStaff } from "@/entities/library/server";
import { withUser } from "@/shared/api/route-helpers";

export async function GET() {
  return withUser((user) => libraryCatalogForStaff(user.id));
}
