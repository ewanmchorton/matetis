// Карточка человека в разделе «Доступы»: { contact } → статус, история оплат, суммы для продления.
// contact — почта или ник в Telegram.
import { getAccessCardForAdmin } from "@/entities/access/server";
import { readJsonObject, withUser } from "@/shared/api/route-helpers";

// POST, а не GET: почта и ник не попадают в адрес запроса и журналы сервера.
export async function POST(request: Request) {
  const { contact } = await readJsonObject(request);
  return withUser((user) => getAccessCardForAdmin(user.id, contact));
}
