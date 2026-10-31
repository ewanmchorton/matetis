// Какие практики открываются на своём экране и что на нём показать.
import type { ProgramPractice } from "../api/my-program.server";

/** «Мышление по навигатору дня» — экран с заметками для себя. */
export const isThinkingPractice = (practice: ProgramPractice) => practice.title.startsWith("Мышление по навигатору");

/**
 * Практика с аудиозаписью: плеер и текст. «Внутренняя улыбка» будет в аудио,
 * но загрузки аудио в админке ещё нет — пока её экран показывает плеер без записи.
 */
export const isAudioPractice = (practice: ProgramPractice) =>
  practice.hasAudio || practice.title === "Внутренняя улыбка";

export const opensPracticeScreen = (practice: ProgramPractice) =>
  isThinkingPractice(practice) || isAudioPractice(practice);

/** Текст из пронумерованных строк («1. Закрываю глаза.») → пункты без номеров; иначе null. */
export function numberedSteps(body: string) {
  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2 || !lines.every((line) => /^\d+\.\s/.test(line))) return null;
  return lines.map((line) => line.replace(/^\d+\.\s+/, ""));
}
