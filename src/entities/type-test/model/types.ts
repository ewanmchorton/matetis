export type TestOption = {
  id: string;
  text: string;
  /** Каким типам этот ответ добавляет балл */
  typeIds: string[];
};

export type TestQuestion = {
  id: string;
  text: string;
  options: TestOption[];
};
