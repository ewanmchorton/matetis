self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Обработчик нужен, чтобы сайт можно было поставить на экран «Домой».
// Запрос здесь не перехватываем: иначе в разработке админка зависает на «Загружаем…»,
// потому что служебный сценарий встаёт между страницей и сервером.
self.addEventListener("fetch", () => {});

// Уведомления администратору: заявки и сводка о доступах (src/shared/push/send-push.ts).
self.addEventListener("push", (event) => {
  const message = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(message.title || "МАТЭТИС", {
      body: message.body || "",
      icon: "icon-192.png",
      data: { url: message.url || "/" },
    }),
  );
});

// Нажатие на уведомление: открыть нужный раздел в уже открытом окне приложения или в новом.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data.url, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => client.url.startsWith(self.location.origin));
      if (open) return open.navigate(url).then((client) => (client || open).focus());
      return self.clients.openWindow(url);
    }),
  );
});
