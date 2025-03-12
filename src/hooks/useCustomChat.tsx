import { useState, useRef } from "react";
import { api } from "~/trpc/react";
import { type Message } from "ai";
import { toast } from "sonner";
import type { Session } from "next-auth";

const startMarker = "<<<CSV_START>>>";
const endMarker = "<<<CSV_END>>>";

export function useCustomChat({
  session,
  tripId,
  initialMessages = [],
  setAllDetailsCollected,
}: {
  session: Session | null;
  tripId: string;
  initialMessages: Message[];
  setAllDetailsCollected: (allDetailsCollected: boolean) => void;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [csvContent, setCsvContent] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);
  const streamRef = useRef<AsyncIterable<{ content: string }> | null>(null);
  const latestMessageRef = useRef<Message | null>(null);
  const accumulatedTextRef = useRef<string>("");
  const insideCsvRef = useRef<boolean>(false);
  const csvBufferRef = useRef<string>("");

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

      // Reset refs for new stream
      accumulatedTextRef.current = "";
      insideCsvRef.current = false;
      csvBufferRef.current = "";

      // Collect the incoming stream and process chunks
      for await (const chunk of streamRef.current) {
        if (abortControllerRef.current?.signal.aborted) {
          toast.info("Stream stopped by user");
          return;
        }

        processChunk(chunk.content, assistantMessage.id);
      }

      setTimeout(() => {
        if (
          accumulatedTextRef.current.includes(
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

  const processChunk = (chunk: string, messageId: string) => {
    // Add chunk to accumulated text buffer
    accumulatedTextRef.current += chunk;

    if (!insideCsvRef.current) {
      const startIndex = accumulatedTextRef.current.indexOf(startMarker);
      if (startIndex !== -1) {
        // Extract text before the marker
        const textBeforeMarker = accumulatedTextRef.current.substring(
          0,
          startIndex,
        );

        // Update the message with text before the marker
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, content: textBeforeMarker } : msg,
          ),
        );

        // Set flag that we're now inside CSV content
        insideCsvRef.current = true;

        // Start collecting CSV content
        csvBufferRef.current = accumulatedTextRef.current.substring(
          startIndex + startMarker.length,
        );

        // Reset accumulated text to just what we've shown
        accumulatedTextRef.current = textBeforeMarker;
      } else {
        // No start marker yet, just update the message with all text
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, content: accumulatedTextRef.current }
              : msg,
          ),
        );
      }
    } else {
      // Inside CSV content
      csvBufferRef.current += chunk;

      const endIndex = csvBufferRef.current.indexOf(endMarker);
      if (endIndex !== -1) {
        // Extract CSV content
        const csvContent = csvBufferRef.current.substring(0, endIndex).trim();
        setCsvContent(csvContent); // Update CSV content as we get it

        // Extract text after the end marker
        const textAfterMarker = csvBufferRef.current.substring(
          endIndex + endMarker.length,
        );

        // Update the message with the text after marker
        accumulatedTextRef.current += textAfterMarker;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, content: accumulatedTextRef.current.trim() }
              : msg,
          ),
        );

        // Reset CSV state
        insideCsvRef.current = false;
        csvBufferRef.current = "";
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const append = async (userMessage: Message) => {
    if (isLoading) return;
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    // Add the user message to state
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    stream.mutate({
      messages: newMessages,
      tripId,
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

  const stopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  return {
    messages,
    input,
    isLoading,
    append,
    handleInputChange,
    handleSubmit,
    setInput,
    stopStream,
    csvContent,
  };
}
