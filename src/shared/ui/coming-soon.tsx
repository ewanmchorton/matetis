import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-8 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-7" />
      </span>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
        Скоро
      </span>
      <p className="max-w-[280px] text-sm leading-relaxed text-muted-foreground">{text}</p>
    </main>
  );
}
