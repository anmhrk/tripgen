import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

export default function UserButton() {
  //   const session = authClient.useSession();

  return (
    <>
      {/* {session.isPending ? (
        <Skeleton className="w-8 h-8 rounded-full" />
      ) : session.data?.user ? (
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer">
            <Avatar>
              <AvatarImage src={session.data?.user.image || ""} />
              <AvatarFallback>
                {session.data?.user.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session.data?.user.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session.data?.user.email}
                </p>
              </div>
            </div>
            <DropdownMenuItem className="font-medium text-muted-foreground transition-none">
              <LogOut className="mr-2 !h-5 !w-5" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : ( */}
      <Button
        variant="outline"
        className="flex flex-row items-center rounded-full font-semibold cursor-pointer transition duration-200 shadow-sm"
        onClick={() => {
          // authClient.signIn.social({
          //   provider: "google",
          //   callbackURL: import.meta.env.VITE_APP_URL,
          // });
        }}
      >
        Sign In
      </Button>
      {/* )} */}
    </>
  );
}
