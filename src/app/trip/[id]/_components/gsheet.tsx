export function GSheet() {
  // temp
  const randomId = Math.random().toString(36).substring(2, 15);

  return (
    <div className="hidden flex-1 flex-col rounded-xl bg-white/70 md:flex">
      <iframe
        src={`https://docs.google.com/spreadsheets/d/${randomId}/edit?embedded=true&rm=minimal`}
        className="h-full w-full rounded-xl"
      />
    </div>
  );
}
