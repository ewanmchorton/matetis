import type { ElementId } from "@/entities/element";

/** Пока формула не зафиксирована: указанная дата просто включает практики одной стихии. */
const demoWeakElementId: ElementId = "wood";

export function weakElementIdFor(birthDate: string | null): ElementId | null {
  return birthDate ? demoWeakElementId : null;
}
