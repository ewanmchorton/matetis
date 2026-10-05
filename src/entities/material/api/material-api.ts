import type { Material } from "../model/types";

const materials: Material[] = [
  {
    id: "m1",
    title: "Памятка: пять стихий и времена года",
    format: "PDF",
    size: "1,2 МБ",
    description: "Короткая шпаргалка — какие стихии когда сменяются и чем отличаются.",
  },
  {
    id: "m2",
    title: "Дневник практик на неделю",
    format: "PDF",
    size: "340 КБ",
    description: "Распечатайте и отмечайте состояние до и после практики.",
  },
  {
    id: "m3",
    title: "Аудио: вечернее расслабление",
    format: "Аудио",
    size: "18 мин",
    description: "Запись голоса Мастера для спокойного сна.",
  },
  {
    id: "m4",
    title: "Эфир Мастера: ответы на вопросы",
    format: "Видео",
    size: "52 мин",
    description: "Запись встречи с учениками о стихии Металла.",
  },
];

export function getMaterials(): Material[] {
  return materials;
}
