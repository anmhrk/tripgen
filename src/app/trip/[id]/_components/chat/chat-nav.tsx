"use client";
import Link from "next/link";
import type { Session } from "next-auth";
import { signIn } from "next-auth/react";
import Image from "next/image";

import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Settings } from "./settings";
import { useIsMobile } from "~/hooks/useIsMobile";
import { FileSpreadsheet } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

interface ChatNavProps {
  name: string;
  isShared: boolean;
  session: Session | null;
  isOwner: boolean;
  showItinerary: boolean;
  setIsMobileSheetOpen: (isMobileSheetOpen: boolean) => void;
}

export function ChatNav({
  name,
  isShared,
  session,
  isOwner,
  setIsMobileSheetOpen,
  showItinerary,
}: ChatNavProps) {
  const isMobile = useIsMobile();

  return (
    <header className="flex w-full items-center justify-between text-zinc-800 dark:text-zinc-300">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.svg" alt="" height={28} width={28} />
        <Label className="text-md select-none font-semibold text-zinc-900 hover:cursor-pointer dark:text-zinc-100">
          TripGen
        </Label>
      </Link>

      {!showItinerary && <p className="mr-11 font-medium">{name}</p>}
      {isShared ? (
        <>
          {session ? (
            <div className="flex items-center">
              {isMobile && showItinerary && (
                <OpenSheetButton setIsMobileSheetOpen={setIsMobileSheetOpen} />
              )}
              <Settings
                showItinerary={showItinerary}
                session={session}
                isOwner={isOwner}
              />
            </div>
          ) : (
            <Button
              onClick={() => signIn("google", { redirect: false })}
              className="h-8 rounded-lg px-2"
            >
              Sign In
            </Button>
          )}
        </>
      ) : (
        <div className="flex items-center">
          {isMobile && showItinerary && (
            <OpenSheetButton setIsMobileSheetOpen={setIsMobileSheetOpen} />
          )}
          <Settings
            showItinerary={showItinerary}
            session={session}
            isOwner={isOwner}
          />
        </div>
      )}
    </header>
  );
}

function OpenSheetButton({
  setIsMobileSheetOpen,
}: {
  setIsMobileSheetOpen: (isMobileSheetOpen: boolean) => void;
}) {
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-zinc-200 dark:hover:bg-zinc-700"
            onClick={() => setIsMobileSheetOpen(true)}
          >
            <FileSpreadsheet className="!h-6 !w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="rounded-lg px-2 py-1.5 text-sm font-medium">
          Open Sheet
        </TooltipContent>
      </Tooltip>
    </>
  );
}
