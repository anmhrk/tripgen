"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Session } from "next-auth";
import { api } from "~/trpc/react";
import { useCustomChat } from "~/hooks/useCustomChat";

import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "~/components/ui/prompt-input";
import { ArrowUp, Loader2, Square } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Messages } from "./messages";
import { ChatNav } from "./chat-nav";
import { cn } from "~/lib/utils";

export function Chat({
  name,
  session,
  isShared,
  isOwner,
  firstMessage,
  allDetailsCollected,
  setAllDetailsCollected,
  setIsMobileSheetOpen,
}: {
  name: string;
  session: Session | null;
  isShared: boolean;
  isOwner: boolean;
  firstMessage: string;
  allDetailsCollected: boolean;
  setAllDetailsCollected: (allDetailsCollected: boolean) => void;
  setIsMobileSheetOpen: (isMobileSheetOpen: boolean) => void;
}) {
  const params = useParams<{ id: string }>();
  const [isInitializing, setIsInitializing] = useState(false);

  const prevMessages = api.trips.getTripMessages.useQuery(
    {
      tripId: params.id,
    },
    {
      refetchOnMount: true,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  );

  const chat = useCustomChat({
    session,
    tripId: params.id,
    initialMessages: prevMessages.data ?? [],
    setAllDetailsCollected,
  });

  const {
    messages,
    input,
    isLoading,
    append,
    handleInputChange,
    handleSubmit,
    stopStream,
  } = chat;

  useEffect(() => {
    if (
      firstMessage &&
      !isInitializing &&
      !allDetailsCollected &&
      prevMessages.data?.length === 0 &&
      messages.length === 0
    ) {
      setIsInitializing(true);
      void append({
        id: crypto.randomUUID(),
        role: "user",
        content: firstMessage,
      });
    }
  }, [
    firstMessage,
    append,
    isInitializing,
    prevMessages.data,
    messages,
    allDetailsCollected,
  ]);

  const allMessages = [...(prevMessages.data ?? []), ...messages];

  return (
    <div
      className={cn(
        "flex h-full w-full flex-shrink-0 flex-col p-1.5",
        !allDetailsCollected && "mx-auto max-w-4xl",
      )}
    >
      {!prevMessages.isLoading && (
        <>
          <ChatNav
            allDetailsCollected={allDetailsCollected}
            name={name}
            isShared={isShared}
            session={session}
            isOwner={isOwner}
            setIsMobileSheetOpen={setIsMobileSheetOpen}
          />
          <div className="flex-1 overflow-y-auto">
            {prevMessages.isLoading ? (
              <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="size-8 animate-spin" />
              </div>
            ) : (
              <Messages
                messages={allMessages}
                session={session}
                isLoading={isLoading}
              />
            )}
          </div>
          <div className="w-full flex-shrink-0">
            <PromptInput
              value={input}
              onValueChange={(value) =>
                handleInputChange({
                  target: { value },
                } as React.ChangeEvent<HTMLTextAreaElement>)
              }
              onSubmit={handleSubmit}
              isLoading={isLoading}
              className="w-full bg-zinc-100 dark:bg-zinc-900"
            >
              <PromptInputTextarea
                autoFocus
                placeholder="Send a message..."
                className="max-h-[200px] min-h-[80px] !text-[15px]"
              />
              <PromptInputActions className="justify-end pt-2">
                <PromptInputAction
                  tooltip={isLoading ? "Stop Stream" : "Send Message"}
                  className="rounded-lg px-2 py-1.5 text-sm font-medium"
                >
                  <Button
                    variant="default"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    disabled={!input && !isLoading}
                    onClick={() => {
                      if (isLoading) {
                        stopStream();
                      }
                      handleSubmit();
                    }}
                  >
                    {isLoading ? (
                      <Square className="size-5 fill-current" />
                    ) : (
                      <ArrowUp className="size-5" />
                    )}
                  </Button>
                </PromptInputAction>
              </PromptInputActions>
            </PromptInput>
          </div>
        </>
      )}
    </div>
  );
}
