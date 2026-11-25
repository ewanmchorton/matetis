import { rm } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { clearDatabase, createPerson } from "../../../../tests/people";

import { addRecommendation, deleteRecommendation, libraryCatalog, readLibraryCover, saveBookCover, saveRecommendationCover } from "./library-content.server";

const png = new File([Uint8Array.from([1, 2, 3, 4])], "cover.png", { type: "image/png" });
const coverDir = path.resolve("private/library-covers");

describe("Обложки библиотеки", () => {
  const files: string[] = [];

  afterEach(async () => {
    await Promise.all(files.map((name) => rm(path.join(coverDir, name), { force: true })));
    files.length = 0;
    await clearDatabase();
  });

  it("картинка сохраняется у книги и фильма на стихии и у книги в разделе", async () => {
    const manager = await createPerson("Мария", "content_manager");
    await addRecommendation(manager, { elementId: "metal", kind: "film", title: "Пробный фильм" });
    const film = (await libraryCatalog()).elements.find((element) => element.id === "metal")?.films.find((item) => item.title === "Пробный фильм");
    expect(film?.coverUrl).toBeNull();

    const saved = (await saveRecommendationCover(manager, { id: film?.id, file: png })).elements
      .find((element) => element.id === "metal")
      ?.films.find((item) => item.id === film?.id);
    files.push(`recommendation-${film?.id}.png`);
    expect(saved?.coverUrl).toBe(`/api/library/cover/recommendation/${film?.id}`);
    const picture = await readLibraryCover("recommendation", film?.id ?? "");
    expect(picture?.type).toBe("image/png");
    expect(picture?.data.byteLength).toBe(4);

    await saveBookCover(manager, { id: "antarova-epub", file: png });
    files.push("book-antarova-epub.png");
    const book = (await libraryCatalog()).books.find((item) => item.id === "antarova-epub");
    expect(book?.coverUrl).toBe("/api/library/cover/book/antarova-epub");
    expect((await readLibraryCover("book", "antarova-epub"))?.data.byteLength).toBe(4);

    await deleteRecommendation(manager, film?.id);
    expect(await readLibraryCover("recommendation", film?.id ?? "")).toBeNull();
  });

  it("обычный человек обложку поставить не может", async () => {
    const anna = await createPerson("Анна");
    await expect(saveBookCover(anna, { id: "antarova-epub", file: png })).rejects.toThrow("Доступно только сотрудникам");
  });
});
