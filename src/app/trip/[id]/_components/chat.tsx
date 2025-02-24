"use client";
import { useState } from "react";

import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "~/components/ui/prompt-input";
import { Button } from "~/components/ui/button";
import { ArrowUp, Square } from "lucide-react";

export function Chat() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    setInput("");
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex w-full flex-col justify-between md:w-[450px]">
      <div className="flex-1" />
      <PromptInput
        value={input}
        onValueChange={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        className="bg-white"
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
  );
}
