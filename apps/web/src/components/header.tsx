import { ThemeToggle } from "./theme-toggle";
import { Plane } from "lucide-react";
import { Button } from "./ui/button";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "./ui/skeleton";

export default function Header() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <div className="flex flex-row items-center justify-between px-6 py-1.5 mt-6 rounded-full bg-gray-950 w-full text-white dark:bg-gray-50 dark:text-black border border-gray-900/10 dark:border-gray-200/30 shadow-md transition-all">
      <div className="flex flex-row items-center gap-2">
        <div className="flex flex-row items-center bg-gradient-to-tr from-white via-gray-100 to-gray-200 dark:from-black dark:via-gray-900 dark:to-gray-800 rounded-full p-2 border border-gray-200 dark:border-gray-800 shadow-sm">
          <Plane className="w-6 h-6 text-black dark:text-white" />
        </div>
        <span className="text-2xl font-semibold tracking-tight">TripGen</span>
      </div>

      <div className="flex flex-row items-center gap-2">
        <ThemeToggle />
        {isPending ? (
          <Skeleton className="h-9 w-20 rounded-full" />
        ) : session ? (
          <img
            src={session.user.image || ""}
            alt="User"
            className="w-8 h-8 rounded-full cursor-pointer border-2 border-transparent hover:border-blue-500 transition duration-200 shadow-sm hover:scale-105"
            onClick={() => {
              authClient.signOut();
            }}
          />
        ) : (
          <Button
            variant="outline"
            className="flex flex-row items-center text-black dark:bg-black dark:text-white rounded-full font-semibold cursor-pointer border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-800 transition duration-200 shadow-sm hover:scale-105"
            onClick={() => {
              authClient.signIn.social({
                provider: "google",
                callbackURL: import.meta.env.VITE_APP_URL,
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
