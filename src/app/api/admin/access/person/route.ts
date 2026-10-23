// Карточка человека в разделе «Доступы»: { email } → статус, история оплат, суммы для продления.
import { getAccessCardForAdmin } from "@/entities/access/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

// POST, а не GET: почта не попадает в адрес запроса и журналы сервера.
export async function POST(request: Request) {
  const { email } = await readJsonObject(request);
  return withUser((user) => getAccessCardForAdmin(user.id, email));
}
