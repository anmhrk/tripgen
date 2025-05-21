import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "./ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Link } from "@tanstack/react-router";
import { Plane } from "lucide-react";

export default function Header() {
  const session = authClient.useSession();

  return (
    <div className="flex flex-row items-center justify-between px-3 py-3 mt-6 w-full border-b border-gray-200 dark:border-gray-700">
      <Link to="/" className="flex flex-row items-center gap-2">
        <div className="border-2 border-purple-300 dark:border-purple-400 bg-purple-100/60 dark:bg-purple-900/30 p-1.5 rounded-full">
          <Plane className="w-6 h-6 text-purple-500 dark:text-purple-300" />
        </div>
        <span className="text-2xl font-semibold font-sans">TripGen</span>
      </Link>
      <div className="flex flex-row items-center gap-2">
        <ThemeToggle />
        {session.isPending ? (
          <Skeleton className="h-9 w-20 rounded-full" />
        ) : session ? (
          // TODO: Add user dropdown
          <Avatar>
            <AvatarImage
              src={session.data?.user.image || ""}
              onClick={() => {
                authClient.signOut();
              }}
            />
            <AvatarFallback>
              {session.data?.user.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <Button
            variant="outline"
            className="flex flex-row items-center rounded-full dark:bg-primary/20 dark:hover:bg-primary/30 font-semibold cursor-pointer transition duration-200 shadow-sm"
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
