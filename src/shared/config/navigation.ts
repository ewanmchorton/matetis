import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Grid3x3,
  ListChecks,
  Shapes,
  Sparkles,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

import { routes } from "./routes";

export type NavLink = { title: string; href: string };

export type NavSection = NavLink & {
  icon: LucideIcon;
  /** Подразделы показываются вкладками под шапкой раздела */
  children?: NavLink[];
};

/**
 * Дерево экранов прототипа. Порядок, названия и вложенность разделов
 * меняются только здесь (и папками в src/app), сами экраны не трогаем.
 */
export const onboardingFlow: NavLink[] = [
  { title: "Авторизация (регистрация)", href: routes.auth },
  { title: "Онбординг", href: routes.onboarding },
  { title: "Тест", href: routes.typeTest },
  { title: "Результат теста", href: routes.typeResult },
];

export const studentNav: NavSection[] = [
  {
    title: "Программа",
    href: routes.program.home,
    icon: Sparkles,
    children: [
      { title: "Главная", href: routes.program.home },
      { title: "Практика сегодня", href: routes.program.today },
      { title: "Еженедельные ритуалы", href: routes.program.rituals },
      { title: "Рекомендации стихии", href: routes.program.recommendations },
      { title: "Статистика", href: routes.program.stats },
    ],
  },
  {
    title: "Библиотека",
    href: routes.library.practices,
    icon: BookOpen,
    children: [
      { title: "Практики", href: routes.library.practices },
      { title: "Книги", href: routes.library.books },
      { title: "Материалы", href: routes.library.materials },
    ],
  },
  {
    title: "Профиль",
    href: routes.profile.type,
    icon: User,
    children: [
      { title: "Тип", href: routes.profile.type },
      { title: "Статистика", href: routes.profile.stats },
      { title: "Настройки", href: routes.profile.settings },
    ],
  },
];

export const adminNav: NavSection[] = [
  { title: "Типы", href: routes.admin.types, icon: Shapes },
  { title: "Тест", href: routes.admin.test, icon: ListChecks },
  { title: "Библиотека практик", href: routes.admin.practices, icon: ClipboardList },
  { title: "Программы", href: routes.admin.programs, icon: Grid3x3 },
  { title: "Пользователи", href: routes.admin.users, icon: Users },
  { title: "Статистика", href: routes.admin.stats, icon: BarChart3 },
];

/** Раздел, к которому относится адрес (для подсветки меню). */
export function findSection(sections: NavSection[], pathname: string) {
  const matches = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return sections.find(
    (s) => matches(s.href) || s.children?.some((c) => matches(c.href)),
  );
}

export type ScreenGroup = {
  title: string;
  description: string;
  screens: (NavLink & { depth?: number })[];
};

const flatten = (sections: NavSection[]) =>
  sections.flatMap((s) =>
    s.children
      ? [
          { title: s.title, href: s.href },
          ...s.children.map((c) => ({ ...c, depth: 1 })),
        ]
      : [{ title: s.title, href: s.href }],
  );

export const screenMap: ScreenGroup[] = [
  {
    title: "Первый вход ученика",
    description: "Регистрация, знакомство и тест на тип",
    screens: onboardingFlow,
  },
  {
    title: "Приложение ученика",
    description: "Нижнее меню: Программа / Библиотека / Профиль",
    screens: [
      ...flatten(studentNav),
      { title: "Карточка практики", href: routes.practice("metal-d1") },
      { title: "Чтение книги", href: routes.library.book("b1") },
    ],
  },
  {
    title: "Кабинет администратора",
    description: "Для Мастера: контент, тест и статистика",
    screens: [
      ...flatten(adminNav),
      { title: "Карточка пользователя", href: routes.admin.user("s1") },
    ],
  },
];
