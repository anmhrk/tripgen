import { ThemeToggle } from "./theme-toggle";
import { Plane } from "lucide-react";
import { Button } from "./ui/button";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "./ui/skeleton";

export default function Header() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <div className="flex flex-row items-center justify-between px-6 py-1.5 mt-6 rounded-sm w-full bg-purple-200 text-black dark:bg-[#3f324a] dark:text-white shadow-md transition-all">
      <div className="flex flex-row items-center gap-2">
        <div className="flex flex-row items-center dark:bg-purple-200 bg-purple-100 border border-purple-200 dark:border-purple-900 rounded-full p-2 shadow-sm">
          <Plane className="w-6 h-6 text-black" />
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
            className="w-8 h-8 rounded-full cursor-pointer transition duration-200 shadow-sm hover:scale-105"
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
