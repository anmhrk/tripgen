export function TopNav({ tripName }: { tripName: string }) {
  return (
    <header className="flex h-10 items-center justify-between border-zinc-200">
      {tripName}
    </header>
  );
}
