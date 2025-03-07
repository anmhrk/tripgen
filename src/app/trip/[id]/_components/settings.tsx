import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { api } from "~/trpc/react";
import { useParams, useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Button } from "~/components/ui/button";
import { LogOut, Moon, Settings2, Sun, Share, Trash } from "lucide-react";
import { DialogTrigger } from "~/components/ui/dialog";
import { DialogContent } from "~/components/ui/dialog";
import { Dialog } from "~/components/ui/dialog";
import { ShareDialog } from "./share-dialog";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

interface SettingsProps {
  session: Session | null;
  isShared: boolean;
  isOwner: boolean;
}

export function Settings({ session, isShared, isOwner }: SettingsProps) {
  const params = useParams<{ id: string }>();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const deleteTrip = api.trips.deleteTrip.useMutation({
    onSuccess: () => {
      toast.success("Trip deleted");
      router.push("/");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (!session) return null;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              <Settings2 className="!h-6 !w-6" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent className="rounded-lg px-2 py-1.5 text-sm font-medium">
          Settings
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent className="w-56 rounded-lg" align="end">
        {session && (
          <>
            <div className="flex items-center justify-start gap-2 p-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={session.user.image ?? ""} />
                <AvatarFallback>
                  {session.user.name?.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session.user.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session.user.email}
                </p>
              </div>
            </div>
            <DropdownMenuItem
              onClick={async () => {
                await signOut({ redirectTo: "/" });
              }}
              className="font-medium text-muted-foreground transition-none"
            >
              <LogOut className="mr-2 !h-5 !w-5" />
              Sign Out
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            setTheme(theme === "dark" ? "light" : "dark");
          }}
          className="font-medium text-muted-foreground transition-none"
        >
          <Moon className="mr-2 !h-5 !w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Sun className="absolute mr-2 !h-5 !w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          {theme === "dark" ? "Light" : "Dark"} Mode
        </DropdownMenuItem>
        {(!isShared || (isShared && isOwner)) && (
          <>
            <DropdownMenuSeparator />
            <Dialog>
              <DialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="font-medium text-muted-foreground transition-none"
                >
                  <Share className="mr-2 !h-5 !w-5" />
                  Share Trip
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <ShareDialog />
              </DialogContent>
            </Dialog>
            <DropdownMenuItem
              onClick={() =>
                window.confirm(
                  "Are you sure you want to delete this trip? This action cannot be undone.",
                ) &&
                toast.promise(deleteTrip.mutateAsync({ tripId: params.id }), {
                  loading: "Deleting trip...",
                })
              }
              className="font-medium text-muted-foreground transition-none hover:text-red-500 focus:text-red-500"
            >
              <Trash className="mr-2 !h-5 !w-5" />
              Delete Trip
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
