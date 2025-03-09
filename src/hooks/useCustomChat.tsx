import { useState, useRef } from "react";
import { api } from "~/trpc/react";
import { type Message } from "ai";
import { toast } from "sonner";
import type { Session } from "next-auth";

export function useCustomChat({
  session,
  tripId,
  initialMessages = [],
  setAllDetailsCollected,
  sheetContent,
}: {
  session: Session | null;
  tripId: string;
  initialMessages: Message[];
  setAllDetailsCollected: (allDetailsCollected: boolean) => void;
  sheetContent: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const streamRef = useRef<AsyncIterable<{ content: string }> | null>(null);
  const latestMessageRef = useRef<Message | null>(null);

  const stream = api.ai.aiChat.useMutation({
    onSuccess: async (data) => {
      if (!data) return;
      streamRef.current = data;

      // Create and add empty assistant message to state
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, assistantMessage]);
      latestMessageRef.current = assistantMessage;

      // Collect the incoming stream
      // Then update the assistant message
      let content = "";
      for await (const chunk of streamRef.current) {
        content += chunk.content;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id ? { ...msg, content } : msg,
          ),
        );
      }

      setTimeout(() => {
        if (
          content.includes(
            "All right, thanks for providing all the information. Let's get started building your perfect itinerary!",
          )
        ) {
          setAllDetailsCollected(true);
        }
      }, 500);
    },
    onError: (error) => {
      toast.error(error.message);
      console.error(error.message);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const append = async (userMessage: Message) => {
    if (isLoading) return;
    setIsLoading(true);

    // Add the user message to state
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    stream.mutate({
      messages: newMessages,
      tripId,
      sheetContent,
    });
  };

  const handleSubmit = () => {
    if (!session) {
      toast.error("Please sign in to send a message");
      return;
    }

    const message: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    };

    setInput("");
    void append(message);
  };

  return {
    messages,
    input,
    isLoading,
    append,
    handleInputChange,
    handleSubmit,
    setInput,
  };
}
