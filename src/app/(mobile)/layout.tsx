import { MobileFrame } from "@/widgets/mobile-frame";

export default function MobileLayout({ children }: LayoutProps<"/">) {
  return <MobileFrame>{children}</MobileFrame>;
}
