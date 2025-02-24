"use client";
import Link from "next/link";
import type { Session } from "next-auth";

import { FaPlane } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import { Share, PenLine } from "lucide-react";
import UserButton from "~/components/user-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useState } from "react";
import { Input } from "~/components/ui/input";

interface TopNavProps {
  tripName: string;
  session: Session;
}

export function TopNav({ tripName, session }: TopNavProps) {
  const [tripNameInput, setTripNameInput] = useState(tripName);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <header className="flex h-10 items-center justify-between px-3">
      <Link href="/" className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-primary p-0 hover:bg-primary/90"
        >
          <FaPlane className="h-4 w-4 text-white" />
        </Button>
        <span className="text-md font-semibold text-zinc-800">TripGen</span>
      </Link>

      <div className="flex items-center gap-1">
        {isEditing ? (
          <Input
            value={tripNameInput}
            onChange={(e) => setTripNameInput(e.target.value)}
            className="w-24"
          />
        ) : (
          <span className="text-md font-medium text-zinc-800">{tripName}</span>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-zinc-200"
              onClick={() => setIsEditing(true)}
            >
              <PenLine className="!h-6 !w-6 text-zinc-800" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="rounded-lg px-2 py-1.5 text-sm font-medium">
            Rename Trip
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-zinc-200">
              <Share className="!h-6 !w-6 text-zinc-800" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="rounded-lg px-2 py-1.5 text-sm font-medium">
            Share Trip
          </TooltipContent>
        </Tooltip>
        <UserButton session={session} className="h-7 w-7" />
      </div>
    </header>
  );
}
