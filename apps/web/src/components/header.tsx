import { ThemeToggle } from "./theme-toggle";
import { Link } from "@tanstack/react-router";
import { Plane } from "lucide-react";
import UserButton from "./user-button";

export default function Header() {
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
        <UserButton />
      </div>
    </div>
  );
}
