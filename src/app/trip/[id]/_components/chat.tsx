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
import { Loader2, ArrowUp, Square } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Messages } from "./messages";
import { ChatNav } from "./chat-nav";

export function Chat({
  session,
  isShared,
  isOwner,
  firstMessage,
}: {
  session: Session | null;
  isShared: boolean;
  isOwner: boolean;
  firstMessage: string;
}) {
  const params = useParams<{ id: string }>();
  const [isInitializing, setIsInitializing] = useState(false);

  const prevMessages = api.chats.getMessages.useQuery(
    {
      tripId: params.id,
    },
    {
      refetchOnMount: true,
      staleTime: 1000 * 60 * 1,
      refetchOnWindowFocus: false,
    },
  );

  const chat = useCustomChat({
    session,
    tripId: params.id,
    initialMessages: prevMessages.data ?? [],
  });

  const {
    messages,
    input,
    isLoading,
    append,
    handleInputChange,
    handleSubmit,
  } = chat;

  useEffect(() => {
    if (firstMessage && !isInitializing && prevMessages.data?.length === 0) {
      setIsInitializing(true);
      void append({
        id: crypto.randomUUID(),
        role: "user",
        content: firstMessage,
      });
    }
  }, [firstMessage, append, isInitializing, prevMessages.data, messages]);

  const allMessages = [...(prevMessages.data ?? []), ...messages];

  return (
    <div className="flex h-full w-full flex-shrink-0 flex-col p-1.5 md:w-[450px]">
      {prevMessages.isLoading ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <ChatNav isShared={isShared} session={session} isOwner={isOwner} />
          <div className="flex-1 overflow-y-auto">
            {allMessages.length > 0 ? (
              <Messages
                messages={allMessages}
                session={session}
                isLoading={isLoading}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-md text-muted-foreground">
                  Start planning your trip by sending a message!
                </p>
              </div>
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
              className="w-full dark:bg-zinc-900"
            >
              <PromptInputTextarea
                autoFocus
                placeholder="Send a message..."
                className="max-h-[200px] min-h-[80px] !text-[15px]"
              />
              <PromptInputActions className="justify-end pt-2">
                <PromptInputAction tooltip="Create Trip">
                  <Button
                    variant="default"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    disabled={!input || isLoading}
                    onClick={handleSubmit}
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
