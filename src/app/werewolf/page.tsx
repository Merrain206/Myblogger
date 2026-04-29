import type { Metadata } from "next";
import ModeSelect from "@/components/werewolf/ModeSelect";

export const metadata: Metadata = {
  title: "AI 狼人杀",
  description: "由 DeepSeek AI 驱动的智能狼人杀，每个 AI 拥有独立的推理和发言能力。",
};

export default function WerewolfPage() {
  return <ModeSelect />;
}
