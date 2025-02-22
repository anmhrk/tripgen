import Link from "next/link";
import { Plane, Sparkles } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";

export default function TripPrompt() {
  return (
    <form className="space-y-8">
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <Textarea
          placeholder="I want to go to Japan for 2 weeks in April..."
          className="min-h-[200px] resize-none border-0 bg-transparent !text-[16px] shadow-none focus-visible:ring-0"
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button size="lg" className="px-8 py-6 text-lg">
          <Plane className="mr-2 !h-5 !w-5" />
          Generate Itinerary
        </Button>

        <Link href="/create/advanced">
          <Button
            variant="outline"
            size="lg"
            className="w-full py-6 text-lg sm:w-auto"
          >
            <Sparkles className="mr-2 !h-5 !w-5" />
            Advanced Mode
          </Button>
        </Link>
      </div>
    </form>
  );
}
