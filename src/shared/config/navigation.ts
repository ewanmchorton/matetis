import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Grid3x3,
  Library,
  ListChecks,
  Sparkles,
  User,
  Users,
  Shapes,
  type LucideIcon,
} from "lucide-react";

import { routes } from "./routes";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

/**
 * Единое место, где описано «дерево экранов» прототипа.
 * Чтобы переставить разделы или переименовать их, достаточно поменять эти списки.
 */
export const studentNav: NavItem[] = [
  { title: "Программа", href: routes.program, icon: Sparkles },
  { title: "Библиотека", href: routes.library, icon: BookOpen },
  { title: "Профиль", href: routes.profile, icon: User },
];

export const adminNav: NavItem[] = [
  { title: "Статистика", href: routes.admin.dashboard, icon: BarChart3 },
  { title: "Ученики", href: routes.admin.students, icon: Users },
  { title: "Типы", href: routes.admin.types, icon: Shapes },
  { title: "Тест", href: routes.admin.test, icon: ListChecks },
  { title: "Программы", href: routes.admin.programs, icon: Grid3x3 },
  { title: "Практики", href: routes.admin.practices, icon: ClipboardList },
  { title: "Библиотека", href: routes.admin.library, icon: Library },
];

export type ScreenGroup = {
  title: string;
  description: string;
  screens: { title: string; href: string; note?: string }[];
};

export const screenMap: ScreenGroup[] = [
  {
    title: "Первый вход ученика",
    description: "Знакомство и тест на определение типа",
    screens: [
      { title: "Приветствие", href: routes.welcome },
      { title: "Тест на тип", href: routes.typeTest },
      { title: "Результат теста", href: routes.typeResult },
    ],
  },
  {
    title: "Приложение ученика",
    description: "Нижнее меню: Программа / Библиотека / Профиль",
    screens: [
      { title: "Программа (главный экран)", href: routes.program },
      { title: "Карточка практики", href: routes.practice("metal-d1") },
      { title: "Библиотека", href: routes.library },
      { title: "Чтение книги", href: routes.book("b1") },
      { title: "Профиль и статистика", href: routes.profile },
    ],
  },
  {
    title: "Кабинет администратора",
    description: "Для Мастера: контент, тест и статистика",
    screens: [
      { title: "Общая статистика", href: routes.admin.dashboard },
      { title: "Ученики", href: routes.admin.students },
      { title: "Карточка ученика", href: routes.admin.student("s1") },
      { title: "12 типов", href: routes.admin.types },
      { title: "Редактор теста", href: routes.admin.test },
      { title: "Программы «тип × стихия»", href: routes.admin.programs },
      { title: "Практики и медиа", href: routes.admin.practices },
      { title: "Библиотека и книги", href: routes.admin.library },
    ],
  },
];
