import Link from "next/link";
import { auth, signIn } from "~/server/auth";
import { redirect } from "next/navigation";

import { Button } from "~/components/ui/button";
import { FaPlane, FaGithub } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Bot, Map, Plane, Power } from "lucide-react";

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

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/create");
  }

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="rounded-lg bg-primary p-2">
            <FaPlane className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-semibold">TripGen</span>
        </Link>
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
      </header>

      <main>
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 pb-20 pt-20 text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">
            Plan your perfect trip with AI-powered itineraries
          </h1>
          <p className="mb-8 text-xl text-gray-600">
            it&apos;s like having a personal travel agent, but wayyy smarter
          </p>
          <div className="flex gap-4">
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/create" });
              }}
            >
              <Button className="text-md h-12 rounded-full bg-[#4285F4] px-6 font-semibold text-white shadow-xl hover:bg-[#4285F4]/90">
                <Power className="mr-2 !h-5 !w-5" strokeWidth={3} />
                Start Now
              </Button>
            </form>
          </div>
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pb-16">
          <div className="grid grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                className={`col-span-3 rounded-2xl bg-white p-8 shadow-lg md:col-span-1 ${
                  idx === 1 && "md:translate-y-8"
                }`}
                key={idx}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
