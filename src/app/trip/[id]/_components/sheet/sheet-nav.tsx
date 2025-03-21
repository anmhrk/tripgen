import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { formatDistance } from "date-fns";
import { TRPCClientError } from "@trpc/client";

import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight, Copy, PenLine } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { useIsMobile } from "~/hooks/useIsMobile";
import { Skeleton } from "~/components/ui/skeleton";

interface SheetNavProps {
  name: string;
  isOwner: boolean;
  lastSaved: Date | null | undefined;
  saving: boolean;
  isDataLoading: boolean;
  csvContent: string;
  version: number;
  currentVersion: number;
  handlePrevVersion: () => void;
  handleNextVersion: () => void;
}

export function SheetNav({
  name,
  isOwner,
  lastSaved,
  saving,
  isDataLoading,
  csvContent,
  version,
  currentVersion,
  handlePrevVersion,
  handleNextVersion,
}: SheetNavProps) {
  const params = useParams<{ id: string }>();
  const [tripNameInput, setTripNameInput] = useState(name);
  const [tripNameEdited, setTripNameEdited] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const isMobile = useIsMobile();

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
      setTripNameInput(name);
      if (error instanceof TRPCClientError) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
      }
    },
    onSettled: () => {
      setIsEditing(false);
    },
  });

  const navItems = [
    {
      disabled: currentVersion === 1,
      label: "Previous Version",
      icon: <ChevronLeft className="!h-5 !w-5" />,
      onClick: handlePrevVersion,
    },
    {
      disabled: currentVersion === version,
      label: "Next Version",
      icon: <ChevronRight className="!h-5 !w-5" />,
      onClick: handleNextVersion,
    },
    {
      disabled: false,
      label: `Copy version ${currentVersion} as .csv`,
      icon: <Copy className="!h-5 !w-5" />,
      onClick: async () => {
        await navigator.clipboard.writeText(csvContent);
        toast.success("Copied to clipboard");
      },
    },
  ];

  return (
    <div className="flex w-full items-center justify-between border-b border-zinc-100 bg-[#F9F9F9] p-2 shadow-sm dark:border-zinc-700 dark:bg-[#27272A]">
      <div className="flex flex-col">
        <div className="flex flex-row items-center gap-1">
          {isEditing ? (
            <Input
              className="w-52 !text-[15px] font-medium"
              value={tripNameInput}
              autoFocus
              onChange={(e) => setTripNameInput(e.target.value)}
              onBlur={() => {
                setTripNameInput(name);
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
                  setTripNameInput(name);
                  setIsEditing(false);
                }
              }}
            />
          ) : (
            <p className={cn(isMobile && "max-w-52 truncate", "font-medium")}>
              {tripNameInput}
            </p>
          )}
          {isOwner && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-1 h-fit w-fit bg-transparent hover:bg-transparent"
                  onClick={() => setIsEditing(true)}
                >
                  <PenLine className="!h-5 !w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-lg px-2 py-1.5 text-sm font-medium">
                Edit Trip Name
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {isDataLoading ? (
            <Skeleton className="mt-1 h-4 w-44" />
          ) : (
            <>
              {saving
                ? "Saving..."
                : `Updated ${
                    lastSaved
                      ? formatDistance(lastSaved, new Date(), {
                          addSuffix: true,
                        })
                      : "never"
                  }`}
            </>
          )}
        </div>
      </div>

      <div className="flex flex-row gap-2">
        {navItems.map((item, idx) => (
          <Tooltip key={idx}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-fit w-fit p-1.5 dark:hover:bg-zinc-700"
                onClick={item.onClick}
                disabled={item.disabled}
              >
                {item.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="rounded-lg px-2 py-1.5 text-sm font-medium">
              {item.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
