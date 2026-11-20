import { unzipSync } from "fflate";

/** Кусок книги, который читалка показывает и листает отдельно. Длинную главу режем, чтобы экран не зависал. */
export type FlowSlice = {
  title: string;
  html: string;
};

export type FlowBook = {
  slices: FlowSlice[];
  revoke: () => void;
};

const BLOCKS_PER_SLICE = 28;

type ZipFiles = Record<string, Uint8Array>;

function decodeXml(bytes: Uint8Array) {
  const head = new TextDecoder("utf-8").decode(bytes.subarray(0, 240)).toLowerCase();
  const encoding = head.includes("windows-1251") || head.includes("cp1251") ? "windows-1251" : "utf-8";
  return new TextDecoder(encoding).decode(bytes);
}

function zipGet(files: ZipFiles, name: string) {
  const direct = files[name] ?? files[name.replace(/^\/+/, "")];
  if (direct) return direct;
  const lower = name.toLowerCase();
  const key = Object.keys(files).find((item) => item.toLowerCase() === lower);
  return key ? files[key] : undefined;
}

function joinZip(baseDir: string, href: string) {
  const clean = href.split("#")[0] ?? "";
  if (!clean || clean.startsWith("data:")) return clean;
  const parts = `${baseDir}/${decodeURIComponent(clean)}`.split("/");
  const out: string[] = [];
  for (const part of parts) {
    if (part === "..") out.pop();
    else if (part && part !== ".") out.push(part);
  }
  return out.join("/");
}

function blobUrl(bytes: Uint8Array, type: string, urls: string[]) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const url = URL.createObjectURL(new Blob([copy], { type }));
  urls.push(url);
  return url;
}

function mimeFromPath(path: string) {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "image/jpeg";
}

function attrHref(element: Element) {
  return (
    element.getAttribute("href") ??
    element.getAttributeNS("http://www.w3.org/1999/xlink", "href") ??
    [...element.attributes].find((attr) => attr.localName === "href")?.value ??
    null
  );
}

/** Убирает скрипты и подставляет картинки книги. */
function cleanHtml(doc: Document, resolve: (href: string) => string | null) {
  const body = doc.body ?? doc.documentElement;
  for (const node of body.querySelectorAll("script, style, link, iframe, object, embed")) node.remove();
  for (const element of body.querySelectorAll("*")) {
    for (const attr of [...element.attributes]) {
      if (attr.name.startsWith("on") || attr.name === "style") element.removeAttribute(attr.name);
    }
  }
  for (const image of body.querySelectorAll("img, image")) {
    const source = image.getAttribute("src") ?? attrHref(image);
    const url = source ? resolve(source) : null;
    if (!url) {
      image.remove();
      continue;
    }
    if (image.tagName.toLowerCase() === "img") image.setAttribute("src", url);
    else {
      const img = doc.createElement("img");
      img.setAttribute("src", url);
      img.setAttribute("alt", "");
      image.replaceWith(img);
    }
  }
  return body.innerHTML.trim();
}

function sliceHtml(title: string, html: string): FlowSlice[] {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, "text/html");
  const root = doc.getElementById("root");
  const blocks = root ? [...root.children] : [];
  if (blocks.length <= BLOCKS_PER_SLICE) return [{ title, html }];
  const slices: FlowSlice[] = [];
  for (let index = 0; index < blocks.length; index += BLOCKS_PER_SLICE) {
    const htmlChunk = blocks
      .slice(index, index + BLOCKS_PER_SLICE)
      .map((node) => node.outerHTML)
      .join("");
    slices.push({ title: index === 0 ? title : `${title}, продолжение`, html: htmlChunk });
  }
  return slices;
}

function openEpub(data: Uint8Array): FlowBook {
  const files = unzipSync(data) as ZipFiles;
  const urls: string[] = [];
  const containerBytes = zipGet(files, "META-INF/container.xml");
  if (!containerBytes) return { slices: [], revoke: () => undefined };
  const container = new DOMParser().parseFromString(decodeXml(containerBytes), "application/xml");
  const rootfile = [...container.getElementsByTagName("*")].find((node) => node.localName === "rootfile");
  const opfPath = rootfile?.getAttribute("full-path");
  if (!opfPath) return { slices: [], revoke: () => undefined };
  const opfBytes = zipGet(files, opfPath);
  if (!opfBytes) return { slices: [], revoke: () => undefined };
  const opf = new DOMParser().parseFromString(decodeXml(opfBytes), "application/xml");
  const opfDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/")) : "";

  const manifest = new Map<string, { href: string; type: string }>();
  for (const item of opf.getElementsByTagName("*")) {
    if (item.localName !== "item") continue;
    const id = item.getAttribute("id");
    const href = item.getAttribute("href");
    if (!id || !href) continue;
    manifest.set(id, { href: joinZip(opfDir, href), type: item.getAttribute("media-type") ?? "" });
  }

  const slices: FlowSlice[] = [];
  let part = 0;
  for (const ref of opf.getElementsByTagName("*")) {
    if (ref.localName !== "itemref") continue;
    const item = manifest.get(ref.getAttribute("idref") ?? "");
    if (!item || !item.type.includes("html")) continue;
    const bytes = zipGet(files, item.href);
    if (!bytes) continue;
    const source = decodeXml(bytes);
    let chapter = new DOMParser().parseFromString(source, "application/xhtml+xml");
    if (chapter.querySelector("parsererror")) chapter = new DOMParser().parseFromString(source, "text/html");
    const chapterDir = item.href.includes("/") ? item.href.slice(0, item.href.lastIndexOf("/")) : "";
    const html = cleanHtml(chapter, (href) => {
      if (href.startsWith("data:")) return href;
      const path = joinZip(chapterDir, href);
      const image = zipGet(files, path);
      return image ? blobUrl(image, mimeFromPath(path), urls) : null;
    });
    const heading = chapter.querySelector("h1, h2");
    const title = heading?.textContent?.replace(/\s+/g, " ").trim() || `Часть ${part + 1}`;
    const next = sliceHtml(title, html).filter((slice) => slice.html.replace(/<[^>]+>/g, "").trim() || slice.html.includes("<img"));
    if (next.length) {
      slices.push(...next);
      part += 1;
    }
  }

  return { slices, revoke: () => { for (const url of urls) URL.revokeObjectURL(url); } };
}

const FB2_NS = "http://www.gribuser.ru/xml/fictionbook/2.0";

function openFb2(data: Uint8Array): FlowBook {
  const urls: string[] = [];
  const xml = new DOMParser().parseFromString(decodeXml(data), "application/xml");
  if (xml.querySelector("parsererror")) return { slices: [], revoke: () => undefined };

  const images = new Map<string, string>();
  for (const binary of xml.getElementsByTagNameNS(FB2_NS, "binary")) {
    const id = binary.getAttribute("id");
    const encoded = binary.textContent?.replace(/\s/g, "") ?? "";
    if (!id || !encoded) continue;
    try {
      const raw = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
      images.set(id, blobUrl(raw, binary.getAttribute("content-type") || "image/jpeg", urls));
    } catch {
      // Битая картинка не должна мешать тексту.
    }
  }

  const page = document.implementation.createHTMLDocument("");

  function picture(node: Element) {
    const href = attrHref(node);
    const id = href?.startsWith("#") ? href.slice(1) : href;
    const url = id ? images.get(id) : undefined;
    if (!url) return null;
    const img = page.createElement("img");
    img.src = url;
    img.alt = "";
    return img;
  }

  function appendInline(target: HTMLElement, node: Node) {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        target.append(child.textContent ?? "");
        continue;
      }
      if (!(child instanceof Element)) continue;
      const name = child.localName;
      if (name === "image") {
        const img = picture(child);
        if (img) target.append(img);
        continue;
      }
      if (name === "emphasis" || name === "strong" || name === "strikethrough") {
        const tag = name === "strong" ? "strong" : name === "strikethrough" ? "s" : "em";
        const wrap = page.createElement(tag);
        appendInline(wrap, child);
        target.append(wrap);
        continue;
      }
      appendInline(target, child);
    }
  }

  function block(node: Element) {
    const name = node.localName;
    if (name === "p" || name === "v" || name === "text-author") {
      const p = page.createElement("p");
      appendInline(p, node);
      return p;
    }
    if (name === "subtitle") {
      const heading = page.createElement("h3");
      appendInline(heading, node);
      return heading;
    }
    if (name === "empty-line") return page.createElement("p");
    if (name === "image") return picture(node);
    if (name === "cite" || name === "epigraph" || name === "poem" || name === "stanza") {
      const quote = page.createElement("blockquote");
      for (const child of [...node.children]) {
        if (child.localName === "stanza" || child.localName === "cite") {
          const nested = block(child);
          if (nested) quote.append(nested);
        } else {
          const line = block(child);
          if (line) quote.append(line);
        }
      }
      return quote;
    }
    return null;
  }

  function sectionTitle(section: Element) {
    const title = [...section.children].find((child) => child.localName === "title");
    return title?.textContent?.replace(/\s+/g, " ").trim() ?? "";
  }

  function sectionSlices(section: Element, inherited: string): FlowSlice[] {
    const title = sectionTitle(section) || inherited || "Глава";
    const blocks: HTMLElement[] = [];
    const nested: FlowSlice[] = [];
    for (const child of [...section.children]) {
      if (child.localName === "section") nested.push(...sectionSlices(child, title));
      else if (child.localName === "title") {
        const heading = page.createElement("h2");
        appendInline(heading, child);
        blocks.push(heading);
      } else {
        const line = block(child);
        if (line) blocks.push(line);
      }
    }
    const host = page.createElement("div");
    for (const line of blocks) host.append(line);
    return [...sliceHtml(title, host.innerHTML), ...nested];
  }

  const slices: FlowSlice[] = [];
  for (const body of xml.getElementsByTagNameNS(FB2_NS, "body")) {
    for (const section of [...body.children].filter((child) => child.localName === "section")) {
      slices.push(...sectionSlices(section, body.getAttribute("name") === "notes" ? "Примечания" : ""));
    }
  }

  return {
    slices: slices.filter((slice) => slice.html.replace(/<[^>]+>/g, "").trim() || slice.html.includes("<img")),
    revoke: () => {
      for (const url of urls) URL.revokeObjectURL(url);
    },
  };
}

/** EPUB и FB2 – в куски HTML. Картинки становятся временными ссылками, их снимает revoke. */
export function openFlowBook(format: "epub" | "fb2", data: ArrayBuffer): FlowBook {
  const bytes = new Uint8Array(data);
  return format === "epub" ? openEpub(bytes) : openFb2(bytes);
}
