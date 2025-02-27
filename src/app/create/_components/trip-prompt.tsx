"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "~/components/ui/prompt-input";
import { Button } from "~/components/ui/button";
import { ArrowUp, Square } from "lucide-react";
import { toast } from "sonner";

export default function TripPrompt() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const createTripFromPrompt = api.trips.createTripFromPrompt.useMutation({
    onSuccess: (data) => {
      router.push(`/trip/${data.tripId}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: () => {
      toast.dismiss("create-trip");
      setIsLoading(false);
    },
  });

  const handleSubmit = async () => {
    if (!input) return;

    setIsLoading(true);
    toast.loading("Creating trip...", { id: "create-trip" });

    await createTripFromPrompt.mutateAsync({
      prompt: input,
    });
  };

  return (
    <PromptInput
      value={input}
      onValueChange={setInput}
      onSubmit={handleSubmit}
      className="max-w-(--breakpoint-md) w-full shadow-lg dark:bg-zinc-900"
      isLoading={isLoading}
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
  );
}
