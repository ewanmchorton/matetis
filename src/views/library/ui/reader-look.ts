export type ReaderFont = "manrope" | "cormorant";

export type ReaderLook = {
  size: number;
  font: ReaderFont;
};

export const readerSizes = [15, 17, 19, 21, 23];

const key = "matetis-reader-look";

export function readLook(): ReaderLook {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? "") as { size?: unknown; font?: unknown };
    const size = readerSizes.includes(Number(raw.size)) ? Number(raw.size) : 17;
    const font = raw.font === "cormorant" ? "cormorant" : "manrope";
    return { size, font };
  } catch {
    return { size: 17, font: "manrope" };
  }
}

export function writeLook(look: ReaderLook) {
  localStorage.setItem(key, JSON.stringify(look));
}
