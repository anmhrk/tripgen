import { memo } from "react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import type { MessageWithUserInfo } from "~/lib/types";
import type { Session } from "next-auth";
import Image from "next/image";

import { Bot } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import Markdown from "react-markdown";

interface MessageItemProps {
  message: MessageWithUserInfo;
  session: Session | null;
}

function MessageItem({ message, session }: MessageItemProps) {
  if (message.role === "assistant") {
    return (
      <div className={cn("flex w-full justify-start")}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div className="flex max-w-[80%] flex-col px-3 text-foreground">
          {message.parts && message.parts.length > 0 ? (
            message.parts.map((part, idx) => {
              if (part.type === "text") {
                return <Markdown key={idx}>{part.text}</Markdown>;
              } else if (part.type === "tool-invocation") {
                const toolInvocation = part.toolInvocation;
                const visibleStates = ["call", "partial-call", "running"];
                const visibleTools = ["webSearch", "generateOrUpdateItinerary"];

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
                      className="relative mt-2 inline-block overflow-hidden"
                    >
                      <span className="text-sm text-muted-foreground">
                        {messageText}...
                      </span>
                    </div>
                  );
                }
              }
              return null;
            })
          ) : (
            <Markdown>{message.content}</Markdown>
          )}
        </div>
      </div>
    );
  }

  if (message.role === "user") {
    return (
      <div className={cn("flex w-full justify-end")}>
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-primary-foreground">
          {message.content}
        </div>
        <div className="ml-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-8 w-8">
                {/* <AvatarImage
                  src={message.profileImage ?? session?.user.image ?? ""}
                  alt="User"
                /> */}
                <Image
                  src={message.profileImage ?? session?.user.image ?? ""}
                  alt="User"
                  width={32}
                  height={32}
                />
                <AvatarFallback>
                  {message.name?.[0] ?? session?.user.name?.[0] ?? ""}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent className="rounded-lg px-2 py-1.5 text-sm font-medium">
              {message.name ?? session?.user.name ?? ""}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  }

  return null;
}

export default memo(MessageItem, (prevProps, nextProps) => {
  return (
    prevProps.message === nextProps.message &&
    prevProps.session === nextProps.session
  );
});
