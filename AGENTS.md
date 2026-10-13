## Communication
- Communicate with the user in Russian.
- Explain technical decisions in plain language.
- Assume the user is not a professional developer.
- Do not hide important architectural decisions behind jargon.
- Before making significant architectural changes, explain the reason and consequences.
# Project rules
- Before significant changes, inspect the existing code and briefly describe the plan.
- Prefer simple, maintainable solutions. Do not overengineer.
- Follow Feature-Sliced Design where it improves code organization.
- Apply Clean Architecture principles pragmatically, without unnecessary abstraction.
- Keep UI, business logic, data access, and infrastructure concerns separated.
- For PostgreSQL database design, use 3NF by default unless there is a clear reason not to.
- Do not introduce new libraries, services, or architectural layers without explaining why they are needed.
- Do not refactor unrelated code unless explicitly requested.
- Keep changes scoped to the current task.
- After meaningful changes, run relevant typecheck, lint, tests, and build.
- Do not hide errors with `any`, `@ts-ignore`, disabled lint rules, or similar workarounds unless clearly justified.
- Never silently change or delete database schema, migrations, or data.
- If an important architectural decision is unclear, present the options instead of guessing.

## Проверка результатов и достоверность отчётов

Перед сообщением о завершении любой задачи агент обязан проверить её фактический результат с помощью инструментов, а не на основании предположений.

1. **Файлы:** после создания, изменения или удаления проверить фактическое состояние файлов.
2. **Git:** всегда различать локальные изменения, коммиты, рабочую ветку, удалённую ветку, pull request и `main`. Не утверждать, что изменения находятся в `main`, если они ещё не объединены.
3. **Публикация:** успешная локальная сборка не означает успешный деплой. Если задача включает публикацию, проверить статус деплоя и результат на опубликованном сайте.
4. **Функциональность:** успешная сборка не означает, что функция работает. Проверить соответствующий пользовательский сценарий.
5. **Отчёт:** сообщать только подтверждённые результаты. Чётко разделять «сделано», «проверено» и «не проверено».
6. **Ошибки:** если проверить результат невозможно, прямо указать это. Не заменять проверку уверенными формулировками.

Перед завершением задач использовать навык Superpowers `verification-before-completion`, когда он применим.

Не требовать от пользователя ручной перепроверки того, что агент способен проверить самостоятельно.

Правило распространяется на все будущие задачи проекта МАТЕТИС.

### Работа с Git

Проект разрабатывает один человек с помощью AI-агентов.

По умолчанию выполняй изменения непосредственно в текущей рабочей ветке `main`, создавай коммит и отправляй его на GitHub после успешных проверок.

Не создавай отдельные ветки, worktrees и Pull Requests для обычных задач, если я явно об этом не попросил.

Для крупных или рискованных изменений сначала предложи работу в отдельной ветке.

Правила Git-процесса проекта имеют приоритет над стандартным workflow навыков Superpowers, если это не противоречит системным ограничениям среды.

## Архитектура приложения

Принятое решение записано в [`docs/architecture.md`](docs/architecture.md). Перед изменениями входа, базы, файлов и публикации читай его и не предлагай другой хостинг, базу или хранилище без явной просьбы.

Кратко: PWA на Cloudflare, авторизация и PostgreSQL в Supabase (Франкфурт), изображения, PDF и книги в Cloudflare R2, видео на внешнем видеохостинге. Свой SMTP нужен для регистрации реальных пользователей. До тестовой группы нужны копии базы и проверка доступности из Беларуси и России без VPN.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
