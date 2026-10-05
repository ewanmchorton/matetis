const formatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });

export function formatDate(iso: string): string {
  return formatter.format(new Date(`${iso}T12:00:00`));
}
