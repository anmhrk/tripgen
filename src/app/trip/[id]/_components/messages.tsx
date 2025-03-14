import { useEffect, useRef, useState } from "react";
import type { Session } from "next-auth";
import type { Message } from "ai";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { ArrowDown, Bot, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Button } from "~/components/ui/button";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const renderedToolIds = new Set<string>();

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    scrollToBottom("instant");
  }, [messages]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setShowScrollButton(distanceFromBottom > 100);
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const renderAssistantMessage = (msg: Message) => {
    if (!msg.parts || msg.parts.length === 0) {
      return msg.content;
    }

    return msg.parts.map((part, partIdx) => {
      if (part.type === "text") {
        return <div key={partIdx}>{part.text}</div>;
      } else if (part.type === "tool-invocation") {
        const toolInvocation = part.toolInvocation;
        const callId = toolInvocation.toolCallId || `tool-${partIdx}`;
        let message = "";

        if (renderedToolIds.has(toolInvocation.toolName)) {
          return null;
        }

        switch (toolInvocation.toolName) {
          case "checkMissingFields":
            message = "Checking missing trip information...";
            break;

          case "updateTripData":
            message = "Updating trip information...";
            break;

          case "allFieldsComplete":
            message = "Finalizing trip information...";
            break;

          case "webSearch":
            message = "Performing web search...";
            break;

          case "generateOrUpdateItinerary":
            message = "Working on the itinerary...";
            break;
        }

        renderedToolIds.add(toolInvocation.toolName);

        const visibleStates = ["call", "partial-call", "running"];
        if (
          !toolInvocation.state ||
          visibleStates.includes(toolInvocation.state)
        ) {
          return (
            <div
              key={callId}
              className="my-1 border-l-2 border-primary/20 pl-2 text-sm italic text-muted-foreground"
            >
              {message}
            </div>
          );
        }
      }
      return null;
    });
  };

  return (
    <div ref={containerRef} className="h-full w-full overflow-y-auto px-2 py-4">
      <div className="flex flex-col space-y-4 pb-8 pr-1">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              "flex w-full",
              msg.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            {msg.role === "assistant" && (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="flex max-w-[80%] flex-col px-3 text-foreground">
                  {renderAssistantMessage(msg)}
                </div>
              </>
            )}

            {msg.role === "user" && session?.user?.image && (
              <>
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-primary-foreground">
                  {msg.content}
                </div>
                <div className="ml-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user.image} alt="User" />
                        <AvatarFallback>
                          {session.user.name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-lg px-2 py-1.5 text-sm font-medium">
                      {session.user.name}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </>
            )}
          </div>
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
        {showScrollButton && (
          <Button
            onClick={() => scrollToBottom()}
            className="fixed bottom-44 left-1/2 -translate-x-1/2 rounded-full bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-800"
            variant="secondary"
          >
            <ArrowDown className="size-5" />
            Scroll to bottom
          </Button>
        )}
      </div>
    </div>
  );
}
