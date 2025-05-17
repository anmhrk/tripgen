import { ThemeToggle } from "./theme-toggle";
import { Plane } from "lucide-react";
import { Button } from "./ui/button";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "./ui/skeleton";

export default function Header() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <div className="flex flex-row items-center justify-between px-4 py-2 mt-6 rounded-full bg-gray-950 w-full text-white dark:bg-gray-50 dark:text-black">
      <div className="flex flex-row items-center gap-2">
        <div className="flex flex-row items-center bg-white dark:bg-black rounded-full p-2">
          <Plane className="w-6 h-6 text-black dark:text-white" />
        </div>
        <span className="text-2xl font-semibold">TripGen</span>
      </div>

      <div className="flex flex-row items-center gap-2">
        <ThemeToggle />
        {isPending ? (
          <Skeleton className="h-9 w-20 rounded-full" />
        ) : session ? (
          <img
            src={session.user.image || ""}
            alt="User"
            className="w-8 h-8 rounded-full cursor-pointer"
            onClick={() => {
              authClient.signOut();
            }}
          />
        ) : (
          <Button
            variant="outline"
            className="flex flex-row items-center text-black dark:bg-black dark:text-white rounded-full font-semibold cursor-pointer"
            onClick={() => {
              authClient.signIn.social({
                provider: "google",
              });
            }}
          >
            Sign In
          </Button>
        )}
      </div>
    </div>
  );
}
