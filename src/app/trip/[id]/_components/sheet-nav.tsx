import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { formatDistance } from "date-fns";

import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight, Copy, Menu, PenLine } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { type Sheet, SHEET_NAMES } from "~/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useIsMobile } from "~/hooks/useIsMobile";
import { Skeleton } from "~/components/ui/skeleton";

interface SheetNavProps {
  name: string;
  isOwner: boolean;
  currentSheet: Sheet;
  setCurrentSheet: (sheet: Sheet) => void;
  lastSaved: Date | undefined;
  saving: boolean;
  isDataLoading: boolean;
}

export function SheetNav({
  name,
  isOwner,
  currentSheet,
  setCurrentSheet,
  lastSaved,
  saving,
  isDataLoading,
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
      toast.error(error.message);
    },
    onSettled: () => {
      setIsEditing(false);
    },
  });

  const navItems = [
    {
      disabled: false,
      label: "Previous Version",
      icon: <ChevronLeft className="!h-5 !w-5" />,
      onClick: () => {
        console.log("clicked");
      },
    },
    {
      disabled: false,
      label: "Next Version",
      icon: <ChevronRight className="!h-5 !w-5" />,
      onClick: () => {
        console.log("clicked");
      },
    },
    {
      disabled: false,
      label: "Copy as .csv",
      icon: <Copy className="!h-5 !w-5" />,
      onClick: () => {
        console.log("clicked");
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
        <Select
          value={currentSheet}
          onValueChange={(value) => {
            setCurrentSheet(value as Sheet);
          }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <SelectTrigger className="min-w-32 rounded-full bg-zinc-100 font-medium dark:bg-zinc-700">
                <SelectValue placeholder="Itinerary" />
              </SelectTrigger>
            </TooltipTrigger>
            <TooltipContent className="rounded-lg px-2 py-1.5 text-sm font-medium">
              Switch Sheets
            </TooltipContent>
          </Tooltip>
          <SelectContent className="rounded-lg">
            {SHEET_NAMES.map((sheet, idx) => (
              <SelectItem key={idx} value={sheet}>
                {sheet.charAt(0).toUpperCase() + sheet.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {navItems.map((item, idx) => (
          <Tooltip key={idx}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="hidden h-fit w-fit p-1.5 dark:hover:bg-zinc-700 md:block"
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

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-fit w-fit p-1.5 dark:hover:bg-zinc-700 md:hidden"
                >
                  <Menu className="!h-5 !w-5" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent className="rounded-lg px-2 py-1.5 text-sm font-medium">
              Menu
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent className="rounded-lg">
            {navItems.map((item, idx) => (
              <DropdownMenuItem key={idx} onClick={item.onClick}>
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
