import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUp } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const PROMPT_SUGGESTIONS = [
  "Plan a romantic weekend getaway in Paris 🗼",
  "Find hidden gems in Southeast Asia for backpackers 🎒",
  "Create a road trip through the US 🚗",
];

function HomeComponent() {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    console.log(prompt); // for now
  };

  return (
    <div className="flex flex-col items-center h-screen max-w-4xl mx-auto w-full px-4">
      <Header />
      <div className="flex flex-col items-center w-full mt-16 gap-6 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">
          Where will your next adventure take you?{" "}
          <span className="inline-block">🌍✈️🗺️</span>
        </h1>
        <div className="relative w-full flex items-center justify-center">
          <Textarea
            className="w-full min-h-[150px] max-h-[250px] rounded-2xl shadow-md resize-none pr-12 text-lg bg-white/90 dark:bg-gray-900/80 border-gray-300 dark:border-gray-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:border-blue-500 dark:focus:ring-blue-900 transition"
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
            className="absolute bottom-3 right-3 bg-purple-400 hover:bg-purple-500 rounded-full shadow-md p-2 transition disabled:opacity-50 disabled:pointer-events-none"
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
              className="cursor-pointer rounded-full text-sm font-medium"
              onClick={() => setPrompt(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
        <div className="mt-10 text-center text-gray-500 text-sm">
          <span className="text-gray-500">
            Fully open source on{" "}
            <a
              href="https://github.com/anmhrk/tripgen"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-black dark:hover:text-white transition"
            >
              GitHub
            </a>
            .
          </span>
        </div>
      </div>
    </div>
  );
}
