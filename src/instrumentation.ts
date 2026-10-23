// Запускается один раз при старте сервера Next.js.
// Таймер ежедневной сводки администратору «доступ скоро закончится» (10:00 по Минску).

/** Как часто проверять, не пора ли отправить сводку. Сама сводка уходит не чаще раза в сутки. */
const DIGEST_CHECK_MS = 10 * 60 * 1000;

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // Во время сборки и в прототипе для GitHub Pages сервера с базой нет.
  if (process.env.NEXT_PHASE === "phase-production-build" || process.env.NEXT_PUBLIC_STATIC_PROTOTYPE === "true") return;

  const { sendExpiringDigest } = await import("@/entities/access/server");
  const check = () =>
    sendExpiringDigest().catch((error: unknown) => console.error("Сводка о доступах не отправлена", error));
  setInterval(check, DIGEST_CHECK_MS).unref();
  void check();
}
