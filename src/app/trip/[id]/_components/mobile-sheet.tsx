import { Drawer } from "vaul";
import { SheetEditor } from "./sheet-editor";
import type { Session } from "next-auth";
interface MobileSheetProps {
  name: string;
  isOwner: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  session: Session | null;
}

export function MobileSheet({
  name,
  isOwner,
  open,
  setOpen,
  session,
}: MobileSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 dark:bg-black/40" />
        <Drawer.Title className="sr-only">Sheet</Drawer.Title>
        <Drawer.Content className="fixed bottom-0 left-0 right-0 mt-24 flex max-h-[80vh] flex-col rounded-t-[10px] bg-[#F9F9F9] outline-none dark:bg-[#27272A]">
          <div className="mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-300" />
          <SheetEditor name={name} isOwner={isOwner} session={session} />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
