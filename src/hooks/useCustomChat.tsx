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

      finalizeProcessing(assistantMessage.id);

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
    console.log("Processing chunk:", chunk);

    // Add this chunk to our accumulated text
    accumulatedTextRef.current += chunk;

    // Check for complete start marker
    const startMarker = "<<<CSV_START>>>";
    const endMarker = "<<<CSV_END>>>";

    // If we're not inside CSV content yet, check if we have a complete start marker
    if (!insideCsvRef.current) {
      const startIndex = accumulatedTextRef.current.indexOf(startMarker);
      if (startIndex !== -1) {
        console.log("Found complete CSV start marker");

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

        // Start collecting CSV content (everything after the marker)
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
      // We're inside CSV content, check for end marker
      const endIndex = csvBufferRef.current.indexOf(endMarker);
      if (endIndex !== -1) {
        console.log("Found complete CSV end marker");

        // Extract CSV content (everything before the end marker)
        const csvContent = csvBufferRef.current.substring(0, endIndex).trim();
        console.log("Extracted CSV content:", csvContent);

        // Set CSV content state
        setCsvContent(csvContent);

        // Extract text after the end marker
        const textAfterMarker = csvBufferRef.current.substring(
          endIndex + endMarker.length,
        );

        // Update accumulated text with text after marker
        accumulatedTextRef.current += textAfterMarker;

        // Update the message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, content: accumulatedTextRef.current }
              : msg,
          ),
        );

        // Reset CSV state
        insideCsvRef.current = false;
        csvBufferRef.current = "";
      } else {
        // Still inside CSV, keep accumulating
        csvBufferRef.current += chunk;
      }
    }
  };

  const finalizeProcessing = (messageId: string) => {
    // If we're still inside CSV content when stream ends
    if (insideCsvRef.current) {
      console.log("Stream ended while still inside CSV content");

      // Check if we have a partial end marker
      const endMarker = "<<<CSV_END>>>";
      const endIndex = csvBufferRef.current.indexOf(endMarker);

      if (endIndex !== -1) {
        // Extract CSV content
        const csvContent = csvBufferRef.current.substring(0, endIndex).trim();
        setCsvContent(csvContent);

        // Extract text after marker
        const textAfterMarker = csvBufferRef.current.substring(
          endIndex + endMarker.length,
        );
        accumulatedTextRef.current += textAfterMarker;
      } else {
        // No end marker found, treat everything as text
        accumulatedTextRef.current += csvBufferRef.current;
      }

      // Update message with final text
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: accumulatedTextRef.current }
            : msg,
        ),
      );
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
