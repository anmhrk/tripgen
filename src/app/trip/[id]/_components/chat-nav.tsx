"use client";
import Link from "next/link";
import type { Session } from "next-auth";
import { signIn } from "next-auth/react";

import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Settings } from "./settings";
import Image from "next/image";

interface ChatNavProps {
  name: string;
  isShared: boolean;
  session: Session | null;
  isOwner: boolean;
  allDetailsCollected: boolean;
}

export function ChatNav({
  name,
  isShared,
  session,
  isOwner,
  allDetailsCollected,
}: ChatNavProps) {
  return (
    <header className="flex w-full items-center justify-between text-zinc-800 dark:text-zinc-300">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.svg" alt="" height={28} width={28} />
        <Label className="text-md select-none font-semibold text-zinc-900 hover:cursor-pointer dark:text-zinc-100">
          TripGen
        </Label>
      </Link>

      {!allDetailsCollected && <p className="mr-11 font-medium">{name}</p>}
      {isShared ? (
        <>
          {session ? (
            <Settings
              allDetailsCollected={allDetailsCollected}
              session={session}
              isOwner={isOwner}
            />
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
        <Settings
          allDetailsCollected={allDetailsCollected}
          session={session}
          isOwner={isOwner}
        />
      )}
    </header>
  );
}
