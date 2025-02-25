"use client";
import Link from "next/link";
import type { Session } from "next-auth";
import { signIn } from "next-auth/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

import { FaPlane } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import { Share, PenLine } from "lucide-react";
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

  return (
    <header className="flex h-10 items-center justify-between px-3 text-zinc-800">
      <Link href="/" className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-primary p-0 hover:bg-primary/90"
        >
          <FaPlane className="h-4 w-4 text-white" />
        </Button>
        <Label className="text-md select-none font-bold hover:cursor-pointer">
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-zinc-200"
                onClick={() => setIsEditing(true)}
              >
                <PenLine className="!h-6 !w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="rounded-lg px-2 py-1.5 text-sm font-medium">
              Rename Trip
            </TooltipContent>
          </Tooltip>
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
          <Dialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-zinc-200"
                  >
                    <Share className="!h-6 !w-6" />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent className="rounded-lg px-2 py-1.5 text-sm font-medium">
                Share Trip
              </TooltipContent>
            </Tooltip>
            <DialogContent>
              <ShareDialog tripName={tripNameInput} />
            </DialogContent>
          </Dialog>
          <UserButton session={session} className="h-7 w-7" />
        </div>
      )}
    </header>
  );
}
