import { Suspense } from "react";

import { AdminStudentPage } from "@/views/admin-student";

// Ученик выбирается параметром ?id=…: так страница собирается и для GitHub Pages, где нет сервера.
export default function Page() {
  return (
    <Suspense>
      <AdminStudentPage />
    </Suspense>
  );
}
