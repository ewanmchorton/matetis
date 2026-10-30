import { Suspense } from "react";

import { AdminPracticesPage } from "@/views/admin-practices";

// Вкладка берётся из адреса (?tab=...), поэтому страница внутри Suspense.
export default function PracticesPage() {
  return (
    <Suspense>
      <AdminPracticesPage />
    </Suspense>
  );
}
