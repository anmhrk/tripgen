"use client";
import { useParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { useMemo, useState } from "react";
import type { Session } from "next-auth";
import { api } from "~/trpc/react";
import { Loader2, ArrowUp, Square } from "lucide-react";

import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "~/components/ui/prompt-input";
import { Button } from "~/components/ui/button";
import { Messages } from "./messages";
import type { Message } from "~/lib/types";
import { ChatNav } from "./chat-nav";

interface ChatProps {
  session: Session | null;
  isShared: boolean;
  isOwner: boolean;
}

export function Chat({ session, isShared, isOwner }: ChatProps) {
  const params = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/question",
    body: {
      tripId: params.id,
    },
    onFinish: () => {
      setIsLoading(false);
    },
  });

  const prevMessages = api.chats.getMessages.useQuery({
    tripId: params.id,
  });

  const combinedMessages = useMemo(() => {
    const allMessages = [...(prevMessages.data ?? []), ...messages];
    return allMessages as Message[];
  }, [prevMessages.data, messages]);

  return (
    <div className="flex h-full flex-col p-1.5">
      {prevMessages.isLoading ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <ChatNav isShared={isShared} session={session} isOwner={isOwner} />
          <div className="min-h-0 flex-1 overflow-y-auto">
            {combinedMessages.length > 0 ? (
              <Messages
                messages={combinedMessages}
                session={session}
                isLoading={isLoading}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
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
              onSubmit={() => {
                setIsLoading(true);
                handleSubmit();
              }}
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
                    onClick={() => {
                      setIsLoading(true);
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
