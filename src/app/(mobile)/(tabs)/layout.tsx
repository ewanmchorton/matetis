import { BottomNav } from "@/widgets/bottom-nav";

/** Общая рамка для вкладок приложения: экран + плавающее нижнее меню. */
export default function TabsLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col pb-[calc(var(--safe-bottom)+var(--nav-bottom)+var(--nav-height))]">
      <div className="flex flex-1 flex-col">{children}</div>
      <BottomNav />
    </div>
  );
}
