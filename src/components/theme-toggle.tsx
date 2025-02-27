"use client";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { Sun, Moon } from "lucide-react";
import { cn } from "~/lib/utils";

export function ThemeToggle({
  className,
  size,
}: {
  className: string;
  size: string;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn("text-zinc-600 dark:text-zinc-300", className)}
    >
      <Sun
        className={cn(
          "rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0",
          size,
        )}
      />
      <Moon
        className={cn(
          "absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100",
          size,
        )}
      />
    </Button>
  );
}
