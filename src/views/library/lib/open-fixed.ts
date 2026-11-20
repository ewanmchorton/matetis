const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export type FixedBook = {
  pageCount: number;
  /**
   * Рисует страницу (номер с 1). cssWidth – ширина листа.
   * maxHeight – вписать страницу в экран: если лист выше, он уменьшается.
   */
  render: (page: number, canvas: HTMLCanvasElement, cssWidth: number, maxHeight?: number) => Promise<void>;
  close: () => void;
};

type PdfPage = {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: {
    canvas: null;
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void>; cancel: () => void };
};

type PdfDocument = {
  numPages: number;
  getPage: (page: number) => Promise<PdfPage>;
  destroy: () => Promise<void> | void;
};

function fitWidth(naturalWidth: number, naturalHeight: number, cssWidth: number, maxHeight?: number) {
  if (!maxHeight || naturalWidth <= 0) return cssWidth;
  const height = (naturalHeight / naturalWidth) * cssWidth;
  if (height <= maxHeight) return cssWidth;
  return (naturalWidth / naturalHeight) * maxHeight;
}

function paintImage(
  canvas: HTMLCanvasElement,
  image: { width: number; height: number; data: Uint8ClampedArray | Uint8Array },
  cssWidth: number,
) {
  const pixels = new Uint8ClampedArray(image.data.length);
  pixels.set(image.data);
  const source = document.createElement("canvas");
  source.width = image.width;
  source.height = image.height;
  source.getContext("2d")?.putImageData(new ImageData(pixels, image.width, image.height), 0, 0);
  const cssHeight = (image.height / image.width) * cssWidth;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(cssWidth * ratio));
  canvas.height = Math.max(1, Math.floor(cssHeight * ratio));
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
}

const pdfRenders = new WeakMap<HTMLCanvasElement, { cancel: () => void; done: Promise<void> }>();

/** Останавливает рисунок, если лист уже сменили. Иначе следующая страница ждёт все предыдущие. */
export function cancelPdfPage(canvas: HTMLCanvasElement) {
  pdfRenders.get(canvas)?.cancel();
}

async function paintPdf(page: PdfPage, canvas: HTMLCanvasElement, cssWidth: number) {
  const previous = pdfRenders.get(canvas);
  if (previous) {
    previous.cancel();
    await previous.done.catch(() => undefined);
  }
  const base = page.getViewport({ scale: 1 });
  const ratio = window.devicePixelRatio || 1;
  const viewport = page.getViewport({ scale: (cssWidth / base.width) * ratio });
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${viewport.height / ratio}px`;
  const context = canvas.getContext("2d");
  if (!context) return;
  // Контекст на странице: отдельный рисовальщик pdf.js не переносит картинки сканов.
  const task = page.render({ canvas: null, canvasContext: context, viewport });
  const handle = { cancel: () => task.cancel(), done: task.promise };
  pdfRenders.set(canvas, handle);
  try {
    await task.promise;
  } finally {
    if (pdfRenders.get(canvas) === handle) pdfRenders.delete(canvas);
  }
}

/** PDF.js рисует и сканы, и текстовые PDF. Файл воркера лежит рядом и должен совпадать с версией pdfjs-dist. */
export async function openPdf(data: ArrayBuffer): Promise<FixedBook> {
  const pdfjs = (await import("pdfjs-dist")) as unknown as {
    GlobalWorkerOptions: { workerSrc: string };
    getDocument: (params: { data: Uint8Array; wasmUrl: string; useWorkerFetch: boolean }) => {
      promise: Promise<PdfDocument>;
      destroy: () => Promise<void>;
    };
  };
  pdfjs.GlobalWorkerOptions.workerSrc = `${basePath}/vendor/pdf.worker.min.mjs`;
  // Копия: pdf.js забирает буфер в воркер, повторное открытие иначе падает.
  const bytes = new Uint8Array(data.slice(0));
  // Сканы часто сжаты JBIG2. Без этих файлов страница остаётся белой.
  const task = pdfjs.getDocument({
    data: bytes,
    wasmUrl: `${basePath}/vendor/pdfjs/`,
    useWorkerFetch: true,
  });
  const doc = await task.promise;
  return {
    pageCount: doc.numPages,
    render: async (page, canvas, cssWidth, maxHeight) => {
      const sheet = await doc.getPage(page);
      const base = sheet.getViewport({ scale: 1 });
      return paintPdf(sheet, canvas, fitWidth(base.width, base.height, cssWidth, maxHeight));
    },
    close: () => {
      void task.destroy?.();
    },
  };
}

type DjvuApi = {
  Document: new (buffer: ArrayBuffer) => {
    getPagesQuantity: () => number;
    getPage: (page: number) => Promise<{
      getImageData: () => { width: number; height: number; data: Uint8ClampedArray | Uint8Array };
    }>;
  };
};

let djvuLoader: Promise<DjvuApi> | null = null;

function loadDjvu(): Promise<DjvuApi> {
  const existing = (window as unknown as { DjVu?: DjvuApi }).DjVu;
  if (existing?.Document) return Promise.resolve(existing);
  djvuLoader ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${basePath}/vendor/djvu.js`;
    script.onload = () => {
      const api = (window as unknown as { DjVu?: DjvuApi }).DjVu;
      if (api?.Document) resolve(api);
      else reject(new Error("djvu"));
    };
    script.onerror = () => reject(new Error("djvu"));
    document.head.appendChild(script);
  });
  return djvuLoader;
}

/** DJVU – те же страницы, что у скана. Рисует DjVu.js, без отдельной программы на компьютере. */
export async function openDjvu(data: ArrayBuffer): Promise<FixedBook> {
  const api = await loadDjvu();
  const doc = new api.Document(data);
  // Библиотека держит в памяти одну страницу: рисуем по очереди, иначе соседние листы портятся.
  let queue = Promise.resolve();
  return {
    pageCount: doc.getPagesQuantity(),
    render: (page, canvas, cssWidth, maxHeight) => {
      const task = queue.then(async () => {
        const sheet = await doc.getPage(page);
        const image = sheet.getImageData();
        paintImage(canvas, image, fitWidth(image.width, image.height, cssWidth, maxHeight));
      });
      queue = task.then(
        () => undefined,
        () => undefined,
      );
      return task;
    },
    close: () => undefined,
  };
}
