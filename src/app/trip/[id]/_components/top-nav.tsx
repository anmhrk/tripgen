"use client";
import Link from "next/link";
import type { Session } from "next-auth";
import { signIn } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

import { Button } from "~/components/ui/button";
import { Share, PenLine, ChevronDown, Trash } from "lucide-react";
import UserButton from "~/components/user-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { Input } from "~/components/ui/input";
import { toast } from "sonner";
import { Label } from "~/components/ui/label";
import { Dialog, DialogTrigger, DialogContent } from "~/components/ui/dialog";
import { ShareDialog } from "./share-dialog";
import { ThemeToggle } from "~/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import Image from "next/image";
interface TopNavProps {
  tripName: string;
  isShared: boolean;
  session: Session | null;
}

export function TopNav({
  tripName: initialTripName,
  isShared,
  session,
}: TopNavProps) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [tripNameInput, setTripNameInput] = useState(initialTripName);
  const [tripNameEdited, setTripNameEdited] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (tripNameEdited) {
      document.title = `${tripNameInput} | TripGen`;
    }
  }, [tripNameEdited]);

  const updateTripName = api.trips.updateTripName.useMutation({
    onSuccess: async () => {
      setTripNameInput(tripNameInput);
      setTripNameEdited(true);
      toast.success("Trip name updated");
    },
    onError: (error) => {
      setTripNameInput(initialTripName);
      toast.error(error.message);
    },
    onSettled: () => {
      setIsEditing(false);
    },
  });

  const deleteTrip = api.trips.deleteTrip.useMutation({
    onSuccess: () => {
      toast.success("Trip deleted");
      router.push("/");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <header className="flex h-10 items-center justify-between px-3 text-zinc-800 dark:text-zinc-300">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.svg" alt="" height={28} width={28} />
        <Label className="text-md hidden select-none font-semibold text-zinc-900 hover:cursor-pointer dark:text-zinc-100 md:block">
          TripGen
        </Label>
      </Link>

      <div className="flex items-center gap-1">
        {isEditing ? (
          <Input
            value={tripNameInput}
            onChange={(e) => setTripNameInput(e.target.value)}
            className="text-md w-48 font-medium"
            autoFocus
            onBlur={() => {
              setTripNameInput(initialTripName);
              setIsEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                toast.promise(
                  updateTripName.mutateAsync({
                    tripId: params.id,
                    name: tripNameInput,
                  }),
                  {
                    loading: "Updating trip name...",
                  },
                );
              }
              if (e.key === "Escape") {
                setTripNameInput(initialTripName);
                setIsEditing(false);
              }
            }}
          />
        ) : (
          <Label className="text-md font-medium">{tripNameInput}</Label>
        )}
        {!isShared && (
          <TripDropdown
            setIsEditing={setIsEditing}
            tripNameInput={tripNameInput}
            deleteTrip={deleteTrip}
            tripId={params.id}
          />
        )}
      </div>

      {isShared ? (
        <>
          {session ? (
            <UserButton session={session} className="h-7 w-7" />
          ) : (
            <Button
              onClick={() => signIn("google", { redirect: false })}
              className="h-8 rounded-lg px-2"
            >
              Sign in
            </Button>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2">
          <ThemeToggle className="h-8 w-8" size="!h-7 !w-7" />
          <UserButton session={session} className="h-7 w-7" />
        </div>
      )}
    </header>
  );
}

interface TripDropdownProps {
  setIsEditing: (isEditing: boolean) => void;
  tripNameInput: string;
  deleteTrip: {
    mutateAsync: (data: { tripId: string }) => Promise<void>;
  };
  tripId: string;
}

function TripDropdown({
  setIsEditing,
  tripNameInput,
  deleteTrip,
  tripId,
}: TripDropdownProps) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              <ChevronDown className="!h-6 !w-6" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent className="rounded-lg px-2 py-1.5 text-sm font-medium">
          Trip Settings
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => setIsEditing(true)}>
          <PenLine className="mr-2 !h-4 !w-4" strokeWidth={2.5} />
          Rename
        </DropdownMenuItem>
        <Dialog>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Share className="mr-2 !h-4 !w-4" strokeWidth={2.5} />
              Share
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent>
            <ShareDialog tripName={tripNameInput} />
          </DialogContent>
        </Dialog>
        <DropdownMenuItem
          className="text-red-500 hover:text-red-500 focus:text-red-500"
          onClick={() =>
            window.confirm("Are you sure you want to delete this trip?") &&
            toast.promise(deleteTrip.mutateAsync({ tripId: tripId }), {
              loading: "Deleting trip...",
            })
          }
        >
          <Trash className="mr-2 !h-4 !w-4" strokeWidth={2.5} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
