import { BottomNav } from "@/widgets/bottom-nav";

/** Общая рамка для вкладок приложения: экран + нижнее меню. */
export default function TabsLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col">{children}</div>
      <BottomNav />
    </div>
  );
}
