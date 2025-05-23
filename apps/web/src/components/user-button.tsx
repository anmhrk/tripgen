import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
  useQuery,
} from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import { api } from "@tripgen/backend/_generated/api";

export default function UserButton() {
  const { signIn, signOut } = useAuthActions();
  const user = useQuery(api.functions.user.getCurrentUser);

  return (
    <>
      <AuthLoading>
        <Skeleton className="w-8 h-8 rounded-full" />
      </AuthLoading>

      <Authenticated>
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer">
            <Avatar>
              <AvatarImage src={user?.image || ""} />
              <AvatarFallback>
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
            <DropdownMenuItem
              className="font-medium text-muted-foreground transition-none"
              onClick={() => {
                void signOut();
              }}
            >
              <LogOut className="mr-2 !h-5 !w-5" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Authenticated>

      <Unauthenticated>
        <Button
          variant="outline"
          className="flex flex-row items-center rounded-full font-semibold cursor-pointer transition duration-200 shadow-sm"
          onClick={() => {
            void signIn("google");
          }}
        >
          Sign In
        </Button>
      </Unauthenticated>
    </>
  );
}
