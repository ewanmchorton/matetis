export type PersonType = {
  id: string;
  number: number;
  name: string;
  /** Тестовый код: буква из группы 1 (А/В/С) + цифра из группы 2 (1–4) */
  code: string;
  traits: string[];
  /** Развёрнутое описание типа (появится позже) */
  description?: string;
};
