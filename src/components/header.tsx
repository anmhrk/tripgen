import Link from "next/link";
import { auth } from "~/server/auth";
import { FaPlane } from "react-icons/fa";
import UserButton from "./user-button";
import { ThemeToggle } from "./theme-toggle";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="rounded-lg bg-black p-2 dark:bg-white">
        <FaPlane className="h-6 w-6 text-white dark:text-black" />
      </div>
      <span className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        TripGen
      </span>
    </Link>
  );
}

export default async function Header() {
  const session = await auth();

  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
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
