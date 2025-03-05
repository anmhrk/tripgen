import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

import { Header } from "~/components/header";
import { CreateHeader } from "./_components/create-header";

export default async function CreateTripLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <main>
      <Header />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <CreateHeader />
        {children}
      </div>
    </main>
  );
}
