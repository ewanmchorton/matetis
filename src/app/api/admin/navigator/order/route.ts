// Порядок посланий внутри одного типа: { typeId, ids } – ids сверху вниз.
import { reorderNavigatorMessages } from "@/entities/program/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

export async function PUT(request: Request) {
  const { typeId, ids } = await readJsonObject(request);
  return withUser((user) => reorderNavigatorMessages(user.id, typeId, ids));
}
