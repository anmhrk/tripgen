"use client";
import { useState } from "react";
// import { useRouter } from "next/navigation";

import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "~/components/ui/prompt-input";
import { Button } from "~/components/ui/button";
import { ArrowUp, Square } from "lucide-react";

export default function TripPrompt() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // const router = useRouter();

  const handleSubmit = async () => {
    if (!input) return;

    setIsLoading(true);
    const randomId = crypto.randomUUID();
    console.log("randomId", randomId);
    // router.push(`/i/${randomId}`);
    setIsLoading(false);

    /* possible flow:
    first validates the input
    then redirects to /i/${randomId}
    then AI does its thing in that route
    */
  };

  return (
    <PromptInput
      value={input}
      onValueChange={setInput}
      onSubmit={handleSubmit}
      className="max-w-(--breakpoint-md) w-full"
    >
      <PromptInputTextarea
        placeholder="I want to go to London for 1 week in April..."
        className="min-h-[240px] !text-[15px]"
      />
      <PromptInputActions className="justify-end pt-2">
        <PromptInputAction tooltip="Create Trip">
          <Button
            variant="default"
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={input.length === 0}
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
  );
}
