"use client";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { cn } from "~/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { DropdownMenu } from "./ui/dropdown-menu";
import { LogOut } from "lucide-react";

interface UserButtonProps {
  session: Session | null;
  className?: string;
}

export default function UserButton({ session, className }: UserButtonProps) {
  if (!session) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar className={cn("hover:cursor-pointer", className)}>
          <AvatarImage src={session.user.image ?? ""} />
          <AvatarFallback>
            {session.user.name?.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end">
        <div className="flex items-center justify-start gap-2 p-2">
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
          className="font-medium text-muted-foreground hover:text-red-500 focus:text-red-500"
        >
          <LogOut className="mr-2 !h-5 !w-5" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
