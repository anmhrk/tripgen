import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import type { Message } from "ai";
import type { Session } from "next-auth";

import { Bot, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

interface ChatMessageProps {
  message: Message;
  session: Session | null;
}

function ChatMessage({ message, session }: ChatMessageProps) {
  if (message.role === "assistant") {
    return (
      <div className={cn("flex w-full justify-start")}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div className="flex max-w-[80%] flex-col px-3 text-foreground">
          {message.parts && message.parts.length > 0
            ? message.parts.map((part, idx) => {
                if (part.type === "text") {
                  return <div key={idx}>{part.text}</div>;
                } else if (part.type === "tool-invocation") {
                  const toolInvocation = part.toolInvocation;
                  const visibleStates = ["call", "partial-call", "running"];
                  const visibleTools = [
                    "webSearch",
                    "generateOrUpdateItinerary",
                  ];

                  if (
                    visibleTools.includes(toolInvocation.toolName) &&
                    (!toolInvocation.state ||
                      visibleStates.includes(toolInvocation.state))
                  ) {
                    let messageText = "";
                    switch (toolInvocation.toolName) {
                      case "webSearch":
                        messageText = "Performing web search";
                        break;

                      case "generateOrUpdateItinerary":
                        messageText = "Working on the itinerary";
                        break;
                    }

                    return (
                      <div
                        key={idx}
                        className="mt-2 flex h-10 items-center justify-center gap-2 rounded-lg bg-primary/10 text-sm text-muted-foreground"
                      >
                        {messageText}
                        <Loader2 className="size-4 animate-spin" />
                      </div>
                    );
                  }
                }
                return null;
              })
            : message.content}
        </div>
      </div>
    );
  }

  if (message.role === "user" && session?.user?.image) {
    return (
      <div className={cn("flex w-full justify-end")}>
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-primary-foreground">
          {message.content}
        </div>
        <div className="ml-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.user.image} alt="User" />
                <AvatarFallback>{session.user.name?.[0]}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent className="rounded-lg px-2 py-1.5 text-sm font-medium">
              {session.user.name}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  }

  return null;
}

export default memo(ChatMessage, (prevProps, nextProps) => {
  return (
    prevProps.message === nextProps.message &&
    prevProps.session === nextProps.session
  );
});
