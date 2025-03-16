import { useEffect, useRef } from "react";
import type { Session } from "next-auth";
import type { Message } from "ai";

import { Bot, Loader2 } from "lucide-react";
import ChatMessage from "./chat-message";

export function Messages({
  messages,
  session,
  isLoading,
}: {
  messages: Message[];
  session: Session | null;
  isLoading: boolean;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, []);

  return (
    <div className="relative h-full w-full overflow-y-auto px-2 py-4">
      <div className="flex flex-col space-y-4 pb-8 pr-1">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} message={msg} session={session} />
        ))}

        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1]?.role === "user" && (
            <div className="flex w-full justify-start">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="flex max-w-[80%] flex-col px-3 text-foreground">
                <Loader2 className="size-7 animate-spin" />
              </div>
            </div>
          )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
