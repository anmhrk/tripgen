import Link from "next/link";
import { auth } from "~/server/auth";

import { FaPlane, FaGithub } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import UserButton from "./user-button";

const socialLinks = [
  {
    href: "https://github.com/anmhrk/tripgen",
    icon: <FaGithub className="h-7 w-7" />,
    label: "GitHub",
  },
  {
    href: "https://x.com/anmhrk",
    icon: <FaXTwitter className="h-7 w-7" />,
    label: "Twitter",
  },
];

export default async function Header() {
  const session = await auth();

  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
      <Link href="/" className="flex items-center gap-2">
        <div className="rounded-lg bg-primary p-2">
          <FaPlane className="h-6 w-6 text-white" />
        </div>
        <span className="text-xl font-semibold">TripGen</span>
      </Link>
      {session ? (
        <UserButton session={session} />
      ) : (
        <nav className="flex items-center gap-4">
          {socialLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target="_blank"
              className="text-zinc-600 hover:text-zinc-900"
            >
              {link.icon}
              <span className="sr-only">{link.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
