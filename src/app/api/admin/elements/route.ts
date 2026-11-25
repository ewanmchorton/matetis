// Картинки стихий для админки.
// GET – все стихии. POST formData { elementId, kind: main | practice, file } – загрузить.
// DELETE { id }. PUT { elementId, ids } – порядок экранов практик.
import { readJsonObject, withUser } from "@/shared/api/route-helpers";
import {
  deleteElementImage,
  listElementPicturesForStaff,
  reorderPracticeImages,
  saveElementImage,
} from "@/entities/element/server";

export async function GET() {
  return withUser((user) => listElementPicturesForStaff(user.id));
}

export async function POST(request: Request) {
  const form = await request.formData();
  return withUser((user) =>
    saveElementImage(user.id, {
      elementId: form.get("elementId"),
      kind: form.get("kind"),
      file: form.get("file"),
    }),
  );
}

export async function DELETE(request: Request) {
  const { id } = await readJsonObject(request);
  return withUser((user) => deleteElementImage(user.id, id));
}

export async function PUT(request: Request) {
  const { elementId, ids } = await readJsonObject(request);
  return withUser((user) => reorderPracticeImages(user.id, elementId, ids));
}
