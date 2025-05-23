import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowUp, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@tripgen/backend/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import { tryCatch } from "@/utils/try-catch";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const PROMPT_SUGGESTIONS = [
  "Plan a romantic weekend getaway in Paris",
  "Plan an adventure-filled trip to Europe",
  "Create a family-friendly road trip through the US",
];

function HomeComponent() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const user = useQuery(api.functions.user.getCurrentUser);
  const { signIn } = useAuthActions();
  const createTrip = useAction(api.functions.trip.createTrip);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!user) {
      window.localStorage.setItem(
        "tripgen_prompt",
        JSON.stringify({
          prompt: prompt,
          timestamp: Date.now() + 5 * 60 * 1000,
        })
      );
      signIn("google");
      return;
    }

    setLoading(true);
    const { data, error } = await tryCatch(createTrip({ prompt }));
    if (error) {
      toast.error(error.toString());
    } else {
      router.navigate({ to: "/trip/$tripId", params: { tripId: data } });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (promptRef.current) {
      promptRef.current.focus();
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        promptRef.current?.blur();
      }
    });
  }, []);

  // If not authed and try to submit, save prompt to local storage with a 5 min future time stamp
  // Recover prompt from local storage if authed within 5 mins
  useEffect(() => {
    const savedPrompt = window.localStorage.getItem("tripgen_prompt");
    if (savedPrompt && user) {
      const { prompt, timestamp } = JSON.parse(savedPrompt);
      if (timestamp > Date.now() + 5 * 60 * 1000) {
        setPrompt(prompt);
      } else {
        window.localStorage.removeItem("tripgen_prompt");
      }
    }
  }, [user]);

  return (
    <div className="flex flex-col items-center min-h-screen max-w-4xl mx-auto w-full px-4">
      <Header />
      <div className="flex flex-col items-center w-full mt-16 gap-6 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-semibold text-center mb-2">
          Plan your perfect trip with AI
        </h1>
        <div className="relative w-full flex items-center justify-center">
          <Textarea
            ref={promptRef}
            className="w-full min-h-[150px] p-3 max-h-[250px] rounded-2xl shadow-md resize-none pr-12 !text-[15px] transition"
            placeholder="Describe your trip here..."
            value={prompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setPrompt(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button
            size="icon"
            className="absolute bottom-3 right-3 rounded-full shadow-md cursor-pointer transition disabled:opacity-50 disabled:pointer-events-none"
            onClick={handleSubmit}
            aria-label="Send"
            disabled={!prompt.trim()}
          >
            {loading ? (
              <Loader2 className="animate-spin !w-5 !h-5" />
            ) : (
              <ArrowUp className="!w-5 !h-5" />
            )}
          </Button>
        </div>
        <div className="flex flex-row flex-wrap gap-2 justify-center mt-2">
          {/* TODO: Prompt suggestions only if user has no recent trips or if not authed */}
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
            className="underline hover:text-primary transition"
          >
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
