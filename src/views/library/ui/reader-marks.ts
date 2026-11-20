export type ReaderMark = { page: number; slice: number };

function key(bookId: string) {
  return `matetis-reader-marks:${bookId}`;
}

export function readMarks(bookId: string): ReaderMark[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key(bookId)) ?? "") as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((item) => {
      const page = Number(item?.page);
      const slice = Number(item?.slice);
      if (!Number.isFinite(page) || page < 1 || !Number.isFinite(slice) || slice < 0) return [];
      return [{ page: Math.floor(page), slice: Math.floor(slice) }];
    });
  } catch {
    return [];
  }
}

export function sameMark(a: ReaderMark, b: ReaderMark) {
  return a.page === b.page && a.slice === b.slice;
}

/** Ставит закладку на это место или снимает, если она уже стоит. */
export function toggleMark(bookId: string, mark: ReaderMark): ReaderMark[] {
  const marks = readMarks(bookId);
  const next = marks.some((item) => sameMark(item, mark))
    ? marks.filter((item) => !sameMark(item, mark))
    : [...marks, mark];
  localStorage.setItem(key(bookId), JSON.stringify(next));
  return next;
}
