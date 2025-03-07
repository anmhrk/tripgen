import { Button } from "~/components/ui/button";

import { formatDistance } from "date-fns";
import { Menu } from "lucide-react";

export function SheetNav({ name }: { name: string }) {
  return (
    <div className="flex w-full flex-row items-start justify-between p-2 px-4 shadow-sm dark:border-[#3F3F46] dark:bg-[#27272A]">
      <div className="flex flex-row items-start gap-4">
        {/* <SheetCloseButton /> */}

        <div className="flex flex-col">
          <div className="font-medium">{name}</div>
          <div className="text-sm text-muted-foreground">
            {`Updated ${formatDistance(new Date(), new Date(), {
              addSuffix: true,
            })}`}
          </div>
        </div>
      </div>
      <div className="flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-900 dark:text-zinc-50"
        >
          <Menu size={20} />
        </Button>
      </div>
    </div>
  );
}
