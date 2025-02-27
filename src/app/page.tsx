import { auth, signIn } from "~/server/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

import Header from "~/components/header";
import { Button } from "~/components/ui/button";
import { Bot, Map, Plane, Power, ArrowRight } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { FaGithub } from "react-icons/fa";

interface SocialLink {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const features = [
  {
    icon: <Plane className="h-6 w-6 text-primary" />,
    title: "Smart Travel Planning",
    description:
      "AI assistant that understands your needs for flights, accommodations, and attractions",
  },
  {
    icon: <Map className="h-6 w-6 text-primary" />,
    title: "Comprehensive Itineraries",
    description:
      "Get detailed trip recommendations you can refine and improve by chatting with the AI",
  },
  {
    icon: <Bot className="h-6 w-6 text-primary" />,
    title: "Automated Organization",
    description:
      "Everything is automatically organized in Google Sheets for easy viewing and sharing",
  },
];

const socialLinks: SocialLink[] = [
  {
    href: "https://github.com/anmhrk/tripgen",
    icon: <FaGithub className="h-6 w-6" />,
    label: "GitHub",
  },
  {
    href: "https://x.com/anmhrk",
    icon: <FaXTwitter className="h-6 w-6" />,
    label: "Twitter",
  },
];

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen">
      <Header />

      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 pb-14 pt-20 text-center">
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-zinc-300 md:text-6xl">
          Plan your perfect trip with AI-powered itineraries
        </h1>
        <p className="mb-8 text-xl text-muted-foreground">
          it&apos;s like having a personal travel agent, but wayyy smarter
        </p>
        <div className="flex gap-4">
          <form
            action={async () => {
              "use server";
              if (session) {
                redirect("/create");
              } else {
                await signIn("google", { redirectTo: "/create" });
              }
            }}
          >
            <Button className="text-md h-12 rounded-full px-6 font-semibold shadow-xl">
              {session ? (
                <>
                  Go to App
                  <ArrowRight className="mr-2 !h-5 !w-5" strokeWidth={3} />
                </>
              ) : (
                <>
                  <Power className="mr-2 !h-5 !w-5" strokeWidth={3} />
                  Get Started
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-16">
        <div className="grid grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              className={`col-span-3 rounded-2xl bg-white p-8 shadow-lg dark:bg-zinc-900 sm:col-span-1 ${
                idx === 1 && "sm:translate-y-8"
              }`}
              key={idx}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <footer className="mx-auto mt-auto w-full pb-3 pt-8 md:pt-14">
        <div className="flex justify-center gap-4">
          {socialLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="h text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              aria-label={link.label}
            >
              {link.icon}
              <span className="sr-only">{link.label}</span>
            </Link>
          ))}
        </div>
      </footer>
    </main>
  );
}
