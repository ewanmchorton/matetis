import type { TestQuestion } from "../model/types";

// Демо-вопросы. Настоящий тест и правило подсчёта — у Мастера.
const questions: TestQuestion[] = [
  {
    id: "q1",
    text: "Как вы обычно восстанавливаете силы?",
    options: [
      { id: "q1a", text: "Побыть одной в тишине", typeIds: ["t5", "t11", "t7"] },
      { id: "q1b", text: "Встретиться с близкими людьми", typeIds: ["t2", "t10", "t12"] },
      { id: "q1c", text: "Заняться делом руками", typeIds: ["t3", "t9", "t8"] },
      { id: "q1d", text: "Выбраться куда-то новое", typeIds: ["t1", "t4", "t6"] },
    ],
  },
  {
    id: "q2",
    text: "Что вам ближе в работе?",
    options: [
      { id: "q2a", text: "Понять, как всё устроено", typeIds: ["t1", "t5"] },
      { id: "q2b", text: "Помочь человеку", typeIds: ["t7", "t2", "t10"] },
      { id: "q2c", text: "Довести до результата", typeIds: ["t6", "t9", "t3"] },
      { id: "q2d", text: "Придумать что-то своё", typeIds: ["t8", "t12", "t4"] },
    ],
  },
  {
    id: "q3",
    text: "Какое время года вы любите больше всего?",
    options: [
      { id: "q3a", text: "Весну", typeIds: ["t3", "t12"] },
      { id: "q3b", text: "Лето", typeIds: ["t4", "t6", "t10"] },
      { id: "q3c", text: "Осень", typeIds: ["t5", "t7", "t8"] },
      { id: "q3d", text: "Зиму", typeIds: ["t11", "t9", "t1", "t2"] },
    ],
  },
  {
    id: "q4",
    text: "Как вы принимаете важные решения?",
    options: [
      { id: "q4a", text: "Доверяю ощущениям", typeIds: ["t7", "t8", "t11"] },
      { id: "q4b", text: "Взвешиваю все за и против", typeIds: ["t5", "t9", "t1"] },
      { id: "q4c", text: "Советуюсь с людьми", typeIds: ["t2", "t10"] },
      { id: "q4d", text: "Решаю быстро и действую", typeIds: ["t6", "t4", "t12", "t3"] },
    ],
  },
  {
    id: "q5",
    text: "Что чаще всего выбивает вас из равновесия?",
    options: [
      { id: "q5a", text: "Суета и шум", typeIds: ["t11", "t5", "t7"] },
      { id: "q5b", text: "Несправедливость", typeIds: ["t6", "t10", "t2"] },
      { id: "q5c", text: "Беспорядок и неопределённость", typeIds: ["t9", "t3"] },
      { id: "q5d", text: "Рутина и однообразие", typeIds: ["t4", "t8", "t12", "t1"] },
    ],
  },
];

export function getTestQuestions(): TestQuestion[] {
  return questions;
}
