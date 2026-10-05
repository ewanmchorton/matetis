import { UserRound } from "lucide-react";

import { ComingSoon } from "@/shared/ui/coming-soon";

export function ProfilePage() {
  return (
    <ComingSoon
      icon={UserRound}
      title="Профиль"
      text="Здесь будут ваши данные, тип, история практик и настройки напоминаний."
    />
  );
}
