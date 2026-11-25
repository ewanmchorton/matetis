// Какие практики открываются на своём экране и что на нём показать.
import type { ProgramPractice } from "../api/my-program.server";

/** «Мышление по навигатору дня» – экран с заметками для себя. */
export const isThinkingPractice = (practice: ProgramPractice) => practice.title.startsWith("Мышление по навигатору");

/**
 * Практика с аудиозаписью: плеер и текст. «Внутренняя улыбка» будет в аудио,
 * но загрузки аудио в админке ещё нет – пока её экран показывает плеер без записи.
 */
export const isAudioPractice = (practice: ProgramPractice) =>
  practice.hasAudio || practice.title === "Внутренняя улыбка";

export const opensPracticeScreen = (practice: ProgramPractice) =>
  isThinkingPractice(practice) || isAudioPractice(practice);

/** Осознание читают целиком на экране практики, на программе – только начало. */
export const isAwarenessPractice = (practice: ProgramPractice) => practice.title.startsWith("Осознание");

/** На карточке программы начало помещается примерно в три строки. */
const AWARENESS_PREVIEW_LIMIT = 110;

/**
 * Начало осознания для карточки программы: первое предложение.
 * Если оно длиннее карточки – столько слов, сколько помещается, и многоточие.
 */
export function awarenessPreview(body: string): string {
  const text = body.trim();
  if (!text) return "";
  const end = text.search(/[.!?…](?=\s|$)/);
  const sentence = end === -1 ? text : text.slice(0, end + 1);
  if ([...sentence].length <= AWARENESS_PREVIEW_LIMIT) return sentence;
  // Один знак оставляем под многоточие. Режем по запятой, чтобы не оборвать фразу на полуслове.
  let preview = "";
  let atComma = "";
  for (const word of sentence.split(/\s+/)) {
    const next = preview ? `${preview} ${word}` : word;
    if ([...next].length > AWARENESS_PREVIEW_LIMIT - 1) break;
    preview = next;
    if (/[,:;]$/u.test(word)) atComma = preview;
  }
  return `${(atComma || preview).replace(/[,:;–—-]+$/u, "").trim()}…`;
}

/** Текст из пронумерованных строк («1. Закрываю глаза.») → пункты без номеров; иначе null. */
export function numberedSteps(body: string) {
  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2 || !lines.every((line) => /^\d+\.\s/.test(line))) return null;
  return lines.map((line) => line.replace(/^\d+\.\s+/, ""));
}
