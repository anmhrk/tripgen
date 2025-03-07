"use client";

interface SheetEditorProps {
  name: string;
}

export function SheetEditor({ name }: SheetEditorProps) {
  return (
    <div className="hidden flex-1 border-l border-zinc-300 bg-white/70 dark:border-zinc-700 dark:bg-black/70 md:flex">
      <div className="flex h-full w-full items-center justify-center">
        <p>{name} sheet will go here</p>
      </div>
    </div>
  );
}
