import { useEffect, useRef, useState } from "react";
import type { Session } from "next-auth";
import type { Message } from "ai";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { ArrowDown, Bot } from "lucide-react";
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
            {msg.role === "assistant" && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
            )}

            <div
              className={cn(
                "max-w-[80%]",
                msg.role === "user"
                  ? "rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-primary-foreground"
                  : "px-3 text-foreground",
              )}
            >
              {isLoading &&
              msg.role === "assistant" &&
              idx === messages.length - 1 ? (
                <Loading />
              ) : (
                msg.content
              )}
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

function Loading() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="text-zinc-500 dark:text-zinc-400"
    >
      <circle cx="4" cy="12" r="3" className="fill-current">
        <animate
          id="spinner_qFRN"
          begin="0;spinner_OcgL.end+0.25s"
          attributeName="cy"
          calcMode="spline"
          dur="0.6s"
          values="12;6;12"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
        />
      </circle>
      <circle cx="12" cy="12" r="3" className="fill-current">
        <animate
          begin="spinner_qFRN.begin+0.1s"
          attributeName="cy"
          calcMode="spline"
          dur="0.6s"
          values="12;6;12"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
        />
      </circle>
      <circle cx="20" cy="12" r="3" className="fill-current">
        <animate
          id="spinner_OcgL"
          begin="spinner_qFRN.begin+0.2s"
          attributeName="cy"
          calcMode="spline"
          dur="0.6s"
          values="12;6;12"
          keySplines=".33,.66,.66,1;.33,0,.66,.33"
        />
      </circle>
    </svg>
  );
}
