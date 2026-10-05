export type TestSection = {
  id: string;
  /** Часть тестового кода: «А», «В», «С» в группе 1 или «1»–«4» в группе 2 */
  code: string;
  text: string;
};

export type TestGroup = {
  id: string;
  title: string;
  /** Что различает группа — рабочая формулировка для админки */
  hint: string;
  sections: TestSection[];
};

export type TypeTest = {
  instruction: string[];
  shortInstruction: string;
  groups: TestGroup[];
};
