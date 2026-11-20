export type ReaderPlace = { page: number; slice: number };

function key(bookId: string) {
  return `matetis-reader:${bookId}`;
}

export function readPlace(bookId: string): ReaderPlace {
  try {
    const raw = JSON.parse(localStorage.getItem(key(bookId)) ?? "") as { page?: unknown; slice?: unknown };
    const page = Number(raw.page);
    const slice = Number(raw.slice);
    return {
      page: Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1,
      slice: Number.isFinite(slice) && slice >= 0 ? Math.floor(slice) : 0,
    };
  } catch {
    return { page: 1, slice: 0 };
  }
}

export function writePlace(bookId: string, place: ReaderPlace) {
  localStorage.setItem(key(bookId), JSON.stringify(place));
}
