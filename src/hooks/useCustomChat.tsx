import { useState, useRef } from "react";
import { api } from "~/trpc/react";
import { type Message } from "ai";
import { toast } from "sonner";

export function useCustomChat({
  tripId,
  initialMessages = [],
}: {
  tripId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const streamRef = useRef<AsyncIterable<{ content: string }> | null>(null);
  const latestMessageRef = useRef<Message | null>(null);

  const stream = api.ai.gatherTripData.useMutation({
    onSuccess: async (data) => {
      streamRef.current = data;

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "",
      };

      // Add the empty assistant message
      setMessages((prev) => [...prev, assistantMessage]);
      latestMessageRef.current = assistantMessage;

      let content = "";
      for await (const chunk of streamRef.current) {
        content += chunk.content;
        // Update the assistant message with new content
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id ? { ...msg, content } : msg,
          ),
        );
      }
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

    // Add the user message to the UI
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    stream.mutate({
      messages: newMessages,
      tripId,
    });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
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
