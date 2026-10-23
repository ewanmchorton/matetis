"use client";

import { useEffect, useState } from "react";

import { authClient } from "@/shared/auth/client";
import { isStaticPrototype } from "@/shared/config/env";

/** Имя для шага «Как вас зовут?»: подставляем уже сохранённое, если оно есть. */
export function useMyName() {
  const [name, setName] = useState("");

  useEffect(() => {
    if (isStaticPrototype) return;
    authClient.getSession().then(({ data }) => {
      const saved = data?.user.name ?? "";
      if (saved) setName((current) => current || saved);
    });
  }, []);

  return [name, setName] as const;
}
