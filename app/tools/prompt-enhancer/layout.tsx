import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prompt Enhancer | Communication Studio",
  description: "Refine prompts into clear, structured requests with AI guidance.",
};

export default function PromptEnhancerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
