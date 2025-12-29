import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Filler Word Counter | Communication Studio",
  description: "Real-time detection of verbal fillers with instant feedback.",
};

export default function FillerWordCounterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
