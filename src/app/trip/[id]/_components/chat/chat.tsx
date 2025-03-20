"use client";
import type { Session } from "next-auth";
import type { MessageWithUserInfo } from "~/lib/types";

import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "~/components/ui/prompt-input";
import { ArrowUp, Square, Loader2, Globe } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Messages } from "./messages";
import { ChatNav } from "./chat-nav";
import { cn } from "~/lib/utils";

interface ChatProps {
  name: string;
  session: Session | null;
  isShared: boolean;
  isOwner: boolean;
  setIsMobileSheetOpen: (isMobileSheetOpen: boolean) => void;
  messages: MessageWithUserInfo[];
  input: string;
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleChatSubmit: () => void;
  isStreaming: boolean;
  dataLoading: boolean;
  showItinerary: boolean;
  webSearchEnabled: boolean;
  setWebSearchEnabled: (webSearchEnabled: boolean) => void;
}

export function Chat({
  name,
  session,
  isShared,
  isOwner,
  setIsMobileSheetOpen,
  messages,
  input,
  handleInputChange,
  handleChatSubmit,
  isStreaming,
  dataLoading,
  showItinerary,
  webSearchEnabled,
  setWebSearchEnabled,
}: ChatProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-shrink-0 flex-col p-1.5",
        !showItinerary && "mx-auto max-w-4xl",
      )}
    >
      <ChatNav
        name={name}
        isShared={isShared}
        session={session}
        isOwner={isOwner}
        setIsMobileSheetOpen={setIsMobileSheetOpen}
        showItinerary={showItinerary}
      />
      <div className="flex-1 overflow-y-auto">
        {dataLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="size-8 animate-spin" />
          </div>
        ) : (
          <Messages
            messages={messages}
            session={session}
            isStreaming={isStreaming}
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
          onSubmit={handleChatSubmit}
          isLoading={isStreaming}
          className="w-full bg-zinc-100 dark:bg-zinc-900"
        >
          <PromptInputTextarea
            autoFocus
            placeholder="Send a message..."
            className="max-h-[200px] min-h-[80px] !text-[15px]"
          />
          <PromptInputActions className="justify-between pt-2">
            <PromptInputAction
              tooltip={
                webSearchEnabled ? "Disable Web Search" : "Enable Web Search"
              }
              side="right"
              className="rounded-lg px-2 py-1.5 text-sm font-medium"
            >
              <Button
                variant="outline"
                className={cn(
                  "h-fit w-fit rounded-xl px-2 py-1.5 text-sm font-medium",
                  webSearchEnabled
                    ? "bg-pink-500 text-white hover:bg-pink-500 hover:text-white dark:bg-pink-600 dark:hover:bg-pink-600"
                    : "bg-neutral-200 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-800",
                )}
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              >
                <Globe className="size-6" />
                Search
              </Button>
            </PromptInputAction>
            <PromptInputAction
              tooltip={isStreaming ? "Stop Stream" : "Send Message"}
              className="rounded-lg px-2 py-1.5 text-sm font-medium"
            >
              <Button
                variant="default"
                size="icon"
                className="h-8 w-8 rounded-full"
                disabled={!input && !isStreaming}
                onClick={handleChatSubmit}
              >
                {isStreaming ? (
                  <Square className="size-5 fill-current" />
                ) : (
                  <ArrowUp className="size-5" />
                )}
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>
      </div>
    </div>
  );
}
