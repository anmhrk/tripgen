"use client";
import Link from "next/link";
import type { Session } from "next-auth";
import { signIn } from "next-auth/react";

import { Button } from "~/components/ui/button";
import { UserButton } from "~/components/user-button";
import { Label } from "~/components/ui/label";
import { ThemeToggle } from "~/components/theme-toggle";
import Image from "next/image";

interface ChatNavProps {
  isShared: boolean;
  session: Session | null;
}

export function ChatNav({ isShared, session }: ChatNavProps) {
  return (
    <header className="flex items-center justify-between text-zinc-800 dark:text-zinc-300">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.svg" alt="" height={28} width={28} />
        <Label className="text-md hidden select-none font-semibold text-zinc-900 hover:cursor-pointer dark:text-zinc-100 md:block">
          TripGen
        </Label>
      </Link>

      {isShared ? (
        <>
          {session ? (
            <UserButton session={session} className="h-7 w-7" />
          ) : (
            <Button
              onClick={() => signIn("google", { redirect: false })}
              className="h-8 rounded-lg px-2"
            >
              Sign in
            </Button>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2">
          <ThemeToggle className="h-8 w-8" size="!h-7 !w-7" />
          <UserButton session={session} className="h-7 w-7" />
        </div>
      )}
    </header>
  );
}
