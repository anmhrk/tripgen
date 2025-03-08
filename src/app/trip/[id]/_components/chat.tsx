/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

"use client";
import { useParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "next-auth";
import { api } from "~/trpc/react";
import type { Message } from "ai";

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
import { toast } from "sonner";

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
  const [isLoading, setIsLoading] = useState(false);
  const utils = api.useUtils();

  const chat = useChat({
    fetch: (...args: any[]) => {
      const requestInit = args[1];
      const parsedBody = JSON.parse(requestInit.body);

      return utils.client.ai.gatherTripData.mutate(
        {
          messages: parsedBody.messages,
          tripId: params.id,
        },
        {
          signal: requestInit.signal,
          context: {
            skipBatch: true,
          },
        },
      );
    },
  });

  const {
    messages,
    input,
    append,
    handleInputChange,
    handleSubmit: handleChatSubmit,
  } = chat;

  const prevMessages = api.chats.getMessages.useQuery({
    tripId: params.id,
  });

  const combinedMessages = useMemo(() => {
    const allMessages = [
      ...(prevMessages.data ?? []),
      ...messages,
    ] as Message[];

    return allMessages;
  }, [prevMessages.data, messages]);

  useEffect(() => {
    if (firstMessage && combinedMessages.length === 0) {
      setIsLoading(true);
      void append({
        role: "user",
        content: firstMessage,
      });
    }
  }, [firstMessage, combinedMessages.length, append]);

  const handleSubmit = () => {
    if (!session) {
      toast.error("Please sign in to send a message");
      return;
    }

    setIsLoading(true);
    handleChatSubmit();
  };

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
            {combinedMessages.length > 0 ? (
              <Messages
                messages={combinedMessages}
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
                    disabled={!input}
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
