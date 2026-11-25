// Картинки текущей стихии для экранов программы: основная и экраны практик.
import { currentElementPictures } from "@/entities/element/server";
import { withUser } from "@/shared/api/route-helpers";

export async function GET() {
  return withUser(() => currentElementPictures());
}
