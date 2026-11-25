// Библиотека для экрана человека: страницы стихий, практики и книги.
import { libraryCatalog } from "@/entities/library/server";
import { withUser } from "@/shared/api/route-helpers";

export async function GET() {
  return withUser(() => libraryCatalog());
}
