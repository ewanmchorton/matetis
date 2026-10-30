// Вход и регистрация (Better Auth). Используется только в серверном коде.
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { isStaff, personRoles } from "@/shared/auth/roles";
import { db } from "@/shared/db";
import * as schema from "@/shared/db/schema";
import { user } from "@/shared/db/schema";
import { APP_NAME } from "@/shared/config/brand";
import { sendEmail } from "@/shared/email/send-email";

import { telegramLogin } from "./telegram-plugin";

const DAY_SECONDS = 24 * 60 * 60;
/** Сколько дней без открытия приложения человек остаётся вошедшим. */
export const SESSION_DAYS = 30;

/** Сколько минут действует код из письма. */
export const SIGN_IN_CODE_MINUTES = 10;

function isBlank(value: unknown): boolean {
  return typeof value !== "string" || value.trim() === "";
}

// При локальном запуске приложение открывают и с телефона в той же Wi-Fi-сети
// (адрес вида http://192.168.0.151:4317). Без этого вход с телефона отклоняется.
const localNetworkOrigins =
  process.env.NODE_ENV === "development"
    ? ["http://192.168.*.*:4317", "http://10.*.*.*:4317", "http://172.*.*.*:4317"]
    : [];

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  trustedOrigins: localNetworkOrigins,
  // Люди входят без пароля: код из письма или бот в Telegram. Первый вход создаёт учётную запись.
  // По почте и паролю входят только сотрудники в админку; пароль задаёт администратор
  // (src/entities/staff), самому зарегистрироваться с паролем нельзя.
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 8 },
  // Вход сохраняется 30 дней с последнего открытия приложения: кто заходит хотя бы раз в месяц,
  // больше не вводит код. Срок продлевается не чаще раза в сутки.
  session: { expiresIn: SESSION_DAYS * DAY_SECONDS, updateAge: DAY_SECONDS },
  user: {
    additionalFields: {
      // input: false — поле нельзя передать ни при регистрации, ни при изменении профиля.
      // Админа назначают только командой на сервере или запросом в базу.
      role: { type: [...personRoles], required: true, defaultValue: "user", input: false },
      // Ставится сервером при создании учётной записи, см. databaseHooks ниже.
      // required: false — иначе Better Auth требует его ещё до хука. В базе поле обязательное.
      consentedAt: { type: "date", required: false, input: false },
      // Заполняются только при входе через Telegram, см. telegram-plugin.ts.
      telegramId: { type: "string", required: false, input: false },
      telegramUsername: { type: "string", required: false, input: false },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/email") {
        const email = typeof ctx.body?.email === "string" ? ctx.body.email.trim().toLowerCase() : "";
        const [person] = await db.select({ role: user.role }).from(user).where(eq(user.email, email));
        // Не сотруднику — тот же ответ, что при неверном пароле: не выдаём, есть ли такая почта.
        if (!isStaff(person?.role)) throw new APIError("UNAUTHORIZED", { message: "Неверная почта или пароль" });
      }
      if (ctx.path === "/update-user" && ctx.body && "name" in ctx.body && isBlank(ctx.body.name)) {
        throw new APIError("BAD_REQUEST", { message: "Имя не может быть пустым" });
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        // Роль и время согласия задаёт только сервер, что бы ни пришло в запросе.
        // Согласие человек даёт кнопкой «Получить код»: под ней написано, с чем он соглашается.
        // Имя при первом входе пустое — его спрашивает тест (шаг «Как вас зовут?»).
        before: async (user) => ({
          data: { ...user, name: user.name.trim(), role: "user", consentedAt: new Date() },
        }),
      },
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: SIGN_IN_CODE_MINUTES * 60,
      storeOTP: "hashed",
      async sendVerificationOTP({ email, otp, type }) {
        if (type !== "sign-in") return;
        await sendEmail({
          to: email,
          subject: `Код для входа в ${APP_NAME}: ${otp}`,
          text: `Ваш код для входа: ${otp}\n\nКод действует ${SIGN_IN_CODE_MINUTES} минут. Если вы не входили в ${APP_NAME}, просто удалите это письмо.`,
        });
      },
    }),
    telegramLogin(),
    // nextCookies — последним: сохраняет вход в cookie для серверных действий Next.js.
    nextCookies(),
  ],
});
