import { Recents } from "./_components/recents";
import { TripPrompt } from "./_components/trip-prompt";

export default async function CreateTripPage() {
  return (
    <>
      <TripPrompt />
      <Recents />
    </>
  );
}
