import { ThemeToggle } from "./theme-toggle";
import { Link } from "@tanstack/react-router";
import { Plane } from "lucide-react";
import UserButton from "./user-button";

export default function Header() {
  return (
    <div className="flex flex-row items-center justify-between px-3 py-3 mt-6 w-full">
      <Link to="/" className="flex flex-row items-center gap-2">
        <div className="border-2 border-primary bg-primary/20 p-1.5 rounded-full">
          <Plane className="w-6 h-6 text-primary" />
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
