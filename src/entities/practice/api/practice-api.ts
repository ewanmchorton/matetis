import type { ElementId } from "@/entities/element";

import type { Practice } from "../model/types";

// Демо-данные: наполнение для одной стихии (Металл), как и планируется на старте.
const practices: Practice[] = [
  {
    id: "metal-d1",
    kind: "daily",
    title: "Дыхание на четыре счёта",
    summary: "Спокойное квадратное дыхание, чтобы собрать внимание с утра.",
    durationMin: 10,
    elementId: "metal",
    typeIds: [],
    steps: [
      "Сядьте удобно, выпрямите спину, положите ладони на колени.",
      "Вдох на четыре счёта, задержка на четыре, выдох на четыре, пауза на четыре.",
      "Сделайте 10 циклов. Если сбились — просто начните счёт заново.",
      "В конце отметьте, как изменилось состояние, — одним словом.",
    ],
    hasImage: true,
    video: { title: "Как дышать на четыре счёта", duration: "6 мин" },
  },
  {
    id: "metal-d2",
    kind: "daily",
    title: "Разбор одного ящика",
    summary: "Металл — время отпускать лишнее. Начнём с малого пространства.",
    durationMin: 15,
    elementId: "metal",
    typeIds: [],
    steps: [
      "Выберите один ящик, полку или папку на компьютере.",
      "Достаньте всё и разложите на три группы: оставить, отдать, выбросить.",
      "Верните на место только то, чем пользуетесь.",
      "Запишите, что почувствовали, когда отпустили вещи.",
    ],
    hasImage: true,
  },
  {
    id: "metal-d3",
    kind: "daily",
    title: "Прогулка без телефона",
    summary: "Двадцать минут наблюдения за осенью вокруг.",
    durationMin: 20,
    elementId: "metal",
    typeIds: ["t1", "t4", "t5", "t7", "t11"],
    steps: [
      "Оставьте телефон дома или выключите звук и уберите в сумку.",
      "Идите в спокойном темпе и замечайте запахи, звуки, цвета листвы.",
      "Найдите один предмет, который вам откликается, и рассмотрите его.",
    ],
    hasImage: false,
  },
  {
    id: "metal-d4",
    kind: "daily",
    title: "Письмо благодарности",
    summary: "Завершаем незавершённое: короткое письмо человеку из прошлого.",
    durationMin: 15,
    elementId: "metal",
    typeIds: [],
    steps: [
      "Вспомните человека, которому так и не сказали «спасибо».",
      "Напишите ему письмо от руки — отправлять не обязательно.",
      "Перечитайте вслух и решите, что с ним сделать.",
    ],
    hasImage: false,
  },
  {
    id: "metal-d5",
    kind: "daily",
    title: "Растяжка грудного отдела",
    summary: "Мягкое раскрытие груди и плеч — зона Металла.",
    durationMin: 12,
    elementId: "metal",
    typeIds: ["t2", "t3", "t6", "t9", "t12"],
    steps: [
      "Встаньте у стены, положите на неё предплечье на уровне плеча.",
      "Медленно поверните корпус от стены, пока не почувствуете растяжение.",
      "Держите 5 глубоких вдохов, затем смените сторону.",
    ],
    hasImage: true,
    video: { title: "Растяжка грудного отдела", duration: "9 мин" },
  },
  {
    id: "metal-d6",
    kind: "daily",
    title: "Вечерний список «отпускаю»",
    summary: "Три вещи, которые вы сегодня отпускаете.",
    durationMin: 7,
    elementId: "metal",
    typeIds: [],
    steps: [
      "Перед сном возьмите блокнот.",
      "Запишите три мысли, обиды или дела, которые больше не хотите нести.",
      "Закройте блокнот и сделайте три медленных выдоха.",
    ],
    hasImage: false,
  },
  {
    id: "metal-r1",
    kind: "ritual",
    title: "Утренняя зарядка стихии",
    summary: "Комплекс из 8 движений для пробуждения тела.",
    durationMin: 20,
    elementId: "metal",
    typeIds: [],
    steps: [
      "Повторяйте за Мастером по видео.",
      "Темп — комфортный, без боли.",
    ],
    hasImage: false,
    video: { title: "Зарядка стихии Металла", duration: "20 мин" },
    weekday: "Понедельник",
  },
  {
    id: "metal-r2",
    kind: "ritual",
    title: "Медитация «Ясное небо»",
    summary: "Аудио-медитация для очищения ума.",
    durationMin: 25,
    elementId: "metal",
    typeIds: [],
    steps: ["Найдите тихое место.", "Включите запись и следуйте голосу."],
    hasImage: false,
    video: { title: "Медитация «Ясное небо»", duration: "25 мин" },
    weekday: "Среда",
  },
  {
    id: "metal-r3",
    kind: "ritual",
    title: "Чайная церемония с собой",
    summary: "Неспешное чаепитие как способ остановиться.",
    durationMin: 30,
    elementId: "metal",
    typeIds: [],
    steps: [
      "Заварите чай без спешки, наблюдая за каждым шагом.",
      "Пейте маленькими глотками, не отвлекаясь на экран.",
    ],
    hasImage: true,
    weekday: "Суббота",
  },
  {
    id: "state-1",
    kind: "state",
    title: "Заземление за 5 минут",
    summary: "Когда тревожно и мысли разбегаются.",
    durationMin: 5,
    typeIds: [],
    steps: [
      "Назовите 5 предметов, которые видите.",
      "4 звука, которые слышите.",
      "3 ощущения в теле, 2 запаха, 1 вкус.",
    ],
    hasImage: false,
    state: "Тревога",
  },
  {
    id: "state-2",
    kind: "state",
    title: "Дыхание «Длинный выдох»",
    summary: "Помогает уснуть, если не получается расслабиться.",
    durationMin: 8,
    typeIds: [],
    steps: ["Вдох на 4 счёта.", "Выдох на 8 счётов.", "Повторите 10 раз."],
    hasImage: false,
    state: "Бессонница",
  },
  {
    id: "state-3",
    kind: "state",
    title: "Энергичная встряска",
    summary: "Когда нет сил начать день.",
    durationMin: 3,
    typeIds: [],
    steps: [
      "Встаньте и потрясите кистями 30 секунд.",
      "Подключите плечи, затем всё тело.",
      "Сделайте глубокий вдох и резкий выдох.",
    ],
    hasImage: true,
    state: "Усталость",
  },
  {
    id: "state-4",
    kind: "state",
    title: "Письмо злости",
    summary: "Безопасно выпустить раздражение на бумагу.",
    durationMin: 10,
    typeIds: [],
    steps: [
      "Пишите всё, что думаете, не выбирая выражений.",
      "Не перечитывайте.",
      "Порвите лист и выбросьте.",
    ],
    hasImage: false,
    state: "Раздражение",
  },
  {
    id: "state-5",
    kind: "state",
    title: "Тёплые ладони",
    summary: "Мягкая самоподдержка, когда грустно.",
    durationMin: 5,
    typeIds: [],
    steps: [
      "Потрите ладони друг о друга до тепла.",
      "Положите их на грудь и побудьте так минуту.",
    ],
    hasImage: false,
    state: "Грусть",
  },
];

const fitsType = (p: Practice, typeId: string) =>
  p.typeIds.length === 0 || p.typeIds.includes(typeId);

export function getPractices(): Practice[] {
  return practices;
}

export function getPractice(id: string): Practice | undefined {
  return practices.find((p) => p.id === id);
}

export function getProgram(typeId: string, elementId: ElementId) {
  const inProgram = practices.filter(
    (p) => p.elementId === elementId && fitsType(p, typeId),
  );
  return {
    daily: inProgram.filter((p) => p.kind === "daily"),
    rituals: inProgram.filter((p) => p.kind === "ritual"),
  };
}

export function getStatePractices(): Practice[] {
  return practices.filter((p) => p.kind === "state");
}

/** День внутри текущей стихии (в демо — фиксированный). */
export const currentElementDay = 12;

export function getTodayPractice(daily: Practice[]): Practice | undefined {
  if (daily.length === 0) return undefined;
  return daily[(currentElementDay - 1) % daily.length];
}
