import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      className="bg-transparent hover:bg-transparent"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="absolute !h-[1.5rem] !w-[1.5rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <Moon className="!h-[1.5rem] !w-[1.5rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
