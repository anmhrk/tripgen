import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const PROMPT_SUGGESTIONS = [
  "Plan a romantic weekend getaway in Paris ❤️",
  "Find hidden gems in Southeast Asia for backpackers 🎒",
  "Create a road trip through the US 🚗",
];

function HomeComponent() {
  const { data: session } = authClient.useSession();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    try {
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  useEffect(() => {
    if (promptRef.current) {
      promptRef.current.focus();
    }
  }, []);

  return (
    <div className="flex flex-col items-center h-screen max-w-4xl mx-auto w-full px-4">
      <Header />
      <div className="flex flex-col items-center w-full mt-16 gap-6 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-semibold text-center mb-2">
          Where will you go next, {session?.user.name?.split(" ")[0]}?{" "}
        </h1>
        <div className="relative w-full flex items-center justify-center">
          <Textarea
            ref={promptRef}
            className="w-full min-h-[150px] p-3 max-h-[250px] rounded-2xl shadow-md resize-none pr-12 !text-md transition"
            placeholder="Describe your dream trip..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                handleSubmit();
              }
            }}
          />
          <Button
            size="icon"
            className="absolute bottom-3 right-3 rounded-full shadow-md p-2 cursor-pointer transition disabled:opacity-50 disabled:pointer-events-none"
            onClick={handleSubmit}
            aria-label="Send"
            disabled={!prompt.trim()}
          >
            <ArrowUp className="!w-5 !h-5" />
          </Button>
        </div>
        <div className="flex flex-row flex-wrap gap-2 justify-center mt-2">
          {PROMPT_SUGGESTIONS.map((suggestion) => (
            <Button
              variant="outline"
              key={suggestion}
              className="cursor-pointer rounded-full text-sm font-medium transition"
              onClick={() => setPrompt(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
        <div className="mt-10 text-center text-gray-500 dark:text-gray-400 text-sm">
          Fully open source on{" "}
          <a
            href="https://github.com/anmhrk/tripgen"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-purple-500 dark:hover:text-purple-400 transition"
          >
            GitHub
          </a>
          .
        </div>
      </div>
    </div>
  );
}
