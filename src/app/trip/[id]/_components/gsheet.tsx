import { useTheme } from "next-themes";

export function GSheet({ gsheetSrc }: { gsheetSrc: string }) {
  const theme = useTheme();

  return (
    <div className="hidden flex-1 flex-col rounded-xl border bg-white/70 dark:bg-black/70 md:flex">
      {gsheetSrc && (
        <iframe
          src={gsheetSrc}
          className="h-full w-full rounded-xl"
          title="Google Sheet"
          style={{
            filter:
              theme.theme === "dark" ? "invert(1) hue-rotate(180deg)" : "none",
          }}
        />
      )}
    </div>
  );
}
