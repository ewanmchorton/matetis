import { InstallReminder } from "@/features/install-app";
import { BottomNav } from "@/widgets/bottom-nav";

/** Общая рамка для вкладок приложения: экран + плавающее нижнее меню. */
export default function TabsLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col pb-[calc(max(var(--nav-bottom),var(--safe-bottom)-12px)+var(--nav-height))]">
      <div className="flex flex-1 flex-col">{children}</div>
      <BottomNav />
      {/* Вернулся в приложение через браузер — раз в 3 дня, не больше 3 раз, напоминаем про «Домой». */}
      <InstallReminder occasion="return" />
    </div>
  );
}
