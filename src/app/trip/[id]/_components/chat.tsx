"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";

import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "~/components/ui/prompt-input";
import { Button } from "~/components/ui/button";
import { ArrowUp, Square } from "lucide-react";

export function Chat() {
  const params = useParams<{ id: string }>();
  // const [isLoading, setIsLoading] = useState(false);

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/question",
    body: {
      tripId: params.id,
    },
  });

  return (
    <div className="flex w-full flex-col justify-between md:w-[450px]">
      <div className="flex-1">
        {messages.map((m) => (
          <div key={m.id} className="whitespace-pre-wrap">
            {m.role === "user" ? "User: " : "AI: "}
            {m.content}
          </div>
        ))}
      </div>
      <PromptInput
        value={input}
        onValueChange={(value) =>
          handleInputChange({
            target: { value },
          } as React.ChangeEvent<HTMLTextAreaElement>)
        }
        onSubmit={handleSubmit}
        // isLoading={isLoading}
        className="w-full shadow-lg dark:bg-zinc-900"
      >
        <PromptInputTextarea
          autoFocus
          placeholder="Send a message..."
          className="min-h-[80px] !text-[15px]"
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
              {/* {isLoading ? (
                  <Square className="size-5 fill-current" />
                ) : (
                  <ArrowUp className="size-5" />
                )} */}
              <ArrowUp className="size-5" />
            </Button>
          </PromptInputAction>
        </PromptInputActions>
      </PromptInput>
    </div>
  );
}
