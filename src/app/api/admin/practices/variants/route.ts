// Одна запись внутри раздела практики: добавить, изменить, удалить, поменять порядок.
import { readJsonObject, withUser } from "@/shared/api/route-helpers";
import {
  deleteSectionVariant,
  ensureSectionPractice,
  reorderPracticeVariants,
  saveSectionVariant,
} from "@/entities/program/server";

export async function POST(request: Request) {
  const body = await readJsonObject(request);
  return withUser(async (user) => {
    const practice = body.practiceId
      ? { id: body.practiceId }
      : await ensureSectionPractice(user.id, (body.practice ?? {}) as Record<string, unknown>);
    return saveSectionVariant(user.id, { ...body, practiceId: practice.id });
  });
}

export async function DELETE(request: Request) {
  const { id } = await readJsonObject(request);
  return withUser((user) => deleteSectionVariant(user.id, id));
}

export async function PUT(request: Request) {
  const { practiceId, ids } = await readJsonObject(request);
  return withUser((user) => reorderPracticeVariants(user.id, practiceId, ids));
}
