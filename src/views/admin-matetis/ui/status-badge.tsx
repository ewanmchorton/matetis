import { formatDay, type AccessStatusDto } from "@/entities/access";
import { cn } from "@/shared/lib/utils";

/** Цвет и текст статуса: зелёный — идёт, жёлтый — скоро закончится, красный — закончился, синий — заявка. */
export function statusView(status: AccessStatusDto): { label: string; className: string } {
  switch (status.kind) {
    case "active":
      return status.expiring
        ? {
            label: status.daysLeft <= 1 ? "закончится сегодня" : `через ${status.daysLeft} дн.`,
            className: "bg-amber-100 text-amber-900",
          }
        : { label: `до ${formatDay(status.until)}`, className: "bg-emerald-100 text-emerald-900" };
    case "expired":
      return { label: "закончился", className: "bg-red-100 text-red-900" };
    case "request":
      return { label: "заявка", className: "bg-sky-100 text-sky-900" };
    case "staff":
      return { label: "команда", className: "bg-muted text-muted-foreground" };
    default:
      return { label: "нет доступа", className: "bg-muted text-muted-foreground" };
  }
}

export function StatusBadge({ status, className }: { status: AccessStatusDto; className?: string }) {
  const view = statusView(status);
  return (
    <span className={cn("inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-medium", view.className, className)}>
      {view.label}
    </span>
  );
}
