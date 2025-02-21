import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

import Header from "~/components/header";
import TripDetailsForm from "~/components/trip-details-form";

export default async function CreatePage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <main>
      <Header />
      <TripDetailsForm />
    </main>
  );
}
