import { cn } from "@/shared/lib/utils";

import type { Book } from "../model/types";

export function BookCover({ book, className }: { book: Book; className?: string }) {
  return (
    <div
      className={cn(
        "flex aspect-[3/4] w-full flex-col justify-between rounded-lg bg-gradient-to-br p-3 text-stone-900 shadow-sm",
        book.cover,
        className,
      )}
    >
      <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">
        {book.author}
      </span>
      <span className="text-sm font-semibold leading-tight">{book.title}</span>
    </div>
  );
}
