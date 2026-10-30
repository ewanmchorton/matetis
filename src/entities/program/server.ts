// Только для серверного кода.
export type { MyProgram, NavigatorToday, ProgramPractice } from "./api/my-program.server";
export {
  getMyNavigator,
  getMyNote,
  getMyProgram,
  markElementVideoSeen,
  markNavigatorRead,
  markWelcomeVideoSeen,
  saveMyNote,
  setPracticeDone,
} from "./api/my-program.server";
export type {
  ElderMessage,
  NavigatorMessage,
  NavigatorMessageInput,
  Practice,
  PracticeInput,
  PracticeVariant,
  ProgramVideo,
  ProgramVideoSlot,
} from "./api/program-content.server";
export {
  deleteElderMessage,
  deleteNavigatorMessage,
  deletePractice,
  listElderMessagesForStaff,
  listNavigatorMessagesForStaff,
  listPracticesForStaff,
  listProgramVideosForStaff,
  programVideoSlots,
  saveElderMessage,
  saveNavigatorMessage,
  savePractice,
  saveProgramVideo,
} from "./api/program-content.server";
