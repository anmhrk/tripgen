import Link from "next/link";
import { auth } from "~/server/auth";
import UserButton from "./user-button";
import { ThemeToggle } from "./theme-toggle";
import Image from "next/image";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image src="/logo.svg" alt="" height={40} width={40} />
      <span className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        TripGen
      </span>
    </Link>
  );
}

export default async function Header() {
  const session = await auth();

  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
      <Logo />
      {session ? (
        <nav className="flex items-center gap-3">
          <ThemeToggle className="h-10 w-10 p-2" size="!h-8 !w-8" />
          <UserButton session={session} />
        </nav>
      ) : (
        <ThemeToggle className="h-10 w-10 p-2" size="!h-8 !w-8" />
      )}
    </header>
  );
}
