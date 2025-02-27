"use client";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

export function GSheet({
  gsheetId: initialGsheetId,
}: {
  gsheetId: string | null;
}) {
  const params = useParams<{ id: string }>();
  const theme = useTheme();
  const [gsheetSrc, setGsheetSrc] = useState("");
  const hasCreatedSheet = useRef(false);

  const createNewGsheet = api.gsheets.createNewGsheet.useMutation({
    onSuccess: (data) => {
      setGsheetSrc(
        `https://docs.google.com/spreadsheets/d/${data.gsheetId}/edit?embedded=true&rm=minimal`,
      );
    },
    onError: (error) => {
      toast.error(error.message);
      console.error(error);
    },
  });

  useEffect(() => {
    // If we already have a sheetId, set the source URL
    if (initialGsheetId) {
      setGsheetSrc(
        `https://docs.google.com/spreadsheets/d/${initialGsheetId}/edit?embedded=true&rm=minimal`,
      );
      return;
    }

    // Only create a new sheet if we haven't already created one
    if (!hasCreatedSheet.current && !createNewGsheet.isPending) {
      hasCreatedSheet.current = true;
      createNewGsheet.mutate({
        tripId: params.id,
      });
    }
  }, [params.id, initialGsheetId, createNewGsheet.isPending]);

  return (
    <div className="hidden flex-1 flex-col rounded-xl border bg-white/70 dark:bg-black/70 md:flex">
      {createNewGsheet.isPending ? (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      ) : (
        <>
          {gsheetSrc && (
            <iframe
              src={gsheetSrc}
              className="h-full w-full rounded-xl"
              title="Google Sheet"
              style={{
                filter:
                  theme.theme === "dark"
                    ? "invert(1) hue-rotate(180deg)"
                    : "none",
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
