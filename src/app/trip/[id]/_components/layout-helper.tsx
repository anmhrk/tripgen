"use client";
import type { Session } from "next-auth";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";

import { TopNav } from "./top-nav";
import { Chat } from "./chat";
import { GSheet } from "./gsheet";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface LayoutHelperProps {
  name: string;
  isShared: boolean;
  session: Session | null;
  initialGsheetId: string | null;
}

export function LayoutHelper({
  name,
  isShared,
  session,
  initialGsheetId,
}: LayoutHelperProps) {
  const params = useParams<{ id: string }>();
  const [gsheetId, setGsheetId] = useState<string | null>(initialGsheetId);
  const [gsheetSrc, setGsheetSrc] = useState("");
  const hasCreatedSheet = useRef(false);

  const createNewGsheet = api.gsheets.createNewGsheet.useMutation({
    onSuccess: (data) => {
      setGsheetId(data.gsheetId);
      setGsheetSrc(
        `https://docs.google.com/spreadsheets/d/${data.gsheetId}/edit?embedded=true&rm=minimal`,
      );
      hasCreatedSheet.current = true;
    },
    onError: (error) => {
      toast.error(error.message);
      console.error(error);
      hasCreatedSheet.current = false;
    },
  });

  useEffect(() => {
    // If we already have a sheetId, set the source URL
    if (gsheetId) {
      setGsheetSrc(
        `https://docs.google.com/spreadsheets/d/${gsheetId}/edit?embedded=true&rm=minimal`,
      );
      hasCreatedSheet.current = true;
      return;
    }

    // Only create a new sheet if we haven't already created one
    if (!hasCreatedSheet.current && !createNewGsheet.isPending) {
      console.log("Creating new Google Sheet");
      createNewGsheet.mutate({
        tripId: params.id,
      });
    }
  }, [params.id, gsheetId, createNewGsheet]);

  //   if (createNewGsheet.isError) {
  //     return (
  //       <p>Error</p>
  //     );
  //   }

  if (createNewGsheet.isPending) {
    return (
      <div className="flex h-screen items-center justify-center gap-2">
        <Loader2 className="size-9 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  } else if (gsheetSrc) {
    return (
      <div className="flex h-screen flex-col overflow-hidden">
        {/* <TopNav tripName={name} isShared={isShared} session={session} /> */}
        <div className="flex flex-1 overflow-hidden">
          <Chat session={session} />
          <GSheet gsheetSrc={gsheetSrc} />
        </div>
      </div>
    );
  }
}
