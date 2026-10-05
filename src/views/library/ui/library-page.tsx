import { BookOpen } from "lucide-react";

import { ComingSoon } from "@/shared/ui/coming-soon";

export function LibraryPage() {
  return (
    <ComingSoon
      icon={BookOpen}
      title="Библиотека"
      text="Здесь будут видео Мастера, медитации, книги и фильмы по всем стихиям."
    />
  );
}
