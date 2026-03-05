import { Metadata } from "next";
import { AiChatClient } from "./client-page";

export const metadata: Metadata = {
  title: "AI Assistant - Chat",
  description: "Asistente de IA impulsado por OpenAI para gestionar tu CRM",
};

export default function AiChatPage() {
  return (
    <div className="h-[calc(100vh-8rem)]">
      <AiChatClient />
    </div>
  );
}
