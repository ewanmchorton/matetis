// Как показывать телефон, суммы и даты доступа.

/** +375293344101 → +375 29 334-41-01. Другие номера — как есть. */
export function formatPhone(phone: string): string {
  const by = /^\+375(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(phone);
  return by ? `+375 ${by[1]} ${by[2]}-${by[3]}-${by[4]}` : phone;
}

/** 2000 → «20 €», 1050 → «10,50 €». */
export function formatEuro(cents: number): string {
  const euros = cents / 100;
  return `${euros.toLocaleString("ru-RU", { minimumFractionDigits: Number.isInteger(euros) ? 0 : 2 })} €`;
}

/** «15 декабря» или «15 декабря 2027», если год не текущий. */
export function formatDay(iso: string): string {
  const date = new Date(iso);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", ...(sameYear ? {} : { year: "numeric" }) });
}
