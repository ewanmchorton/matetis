// Только для серверного кода.
export type { MyProgram, NavigatorToday, ProgramPractice } from "./api/my-program.server";
export {
  getMyNavigator,
  getMyNote,
  getMyProgram,
  markNavigatorRead,
  markWelcomeVideoSeen,
  saveMyNote,
  setPracticeDone,
} from "./api/my-program.server";
export type {
  NavigatorMessage,
  NavigatorMessageInput,
  Practice,
  PracticeInput,
  ProgramVideo,
  ProgramVideoSlot,
} from "./api/program-content.server";
export {
  deleteNavigatorMessage,
  deletePractice,
  listNavigatorMessagesForStaff,
  listPracticesForStaff,
  listProgramVideosForStaff,
  programVideoSlots,
  saveNavigatorMessage,
  savePractice,
  saveProgramVideo,
} from "./api/program-content.server";
