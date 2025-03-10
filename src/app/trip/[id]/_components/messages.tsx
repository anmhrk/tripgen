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

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Instant scroll to bottom on page load
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
            {isLoading &&
            msg.role === "assistant" &&
            idx === messages.length - 1 ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="size-5 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                )}
              </>
            )}

            <div
              className={cn(
                "max-w-[80%]",
                msg.role === "user"
                  ? "rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-primary-foreground"
                  : "px-3 text-foreground",
              )}
            >
              {msg.content}
            </div>

            {msg.role === "user" && session?.user?.image && (
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
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {showScrollButton && (
        <Button
          onClick={() => scrollToBottom()}
          className="fixed bottom-44 left-1/2 -translate-x-1/2 rounded-full"
          variant="secondary"
        >
          <ArrowDown className="size-5" />
          Scroll to bottom
        </Button>
      )}
    </div>
  );
}
