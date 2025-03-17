import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import type { Session } from "next-auth";

import { toast } from "sonner";
import { Button } from "~/components/ui/button";

interface VersionBannerProps {
  session: Session | null;
  version: number | undefined;
  goToLatestVersion: () => void;
  setVersion: (version: number) => void;
  setCurrentVersion: (version: number) => void;
}

export function VersionBanner({
  session,
  version,
  goToLatestVersion,
  setVersion,
  setCurrentVersion,
}: VersionBannerProps) {
  const params = useParams<{ id: string }>();
  const restoreVersion = api.trips.restoreItineraryVersion.useMutation({
    onSuccess: () => {
      setVersion(version!);
      setCurrentVersion(version!);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="h-15 absolute bottom-0 left-0 right-0 flex w-full items-center justify-between border-t border-zinc-100 bg-[#F9F9F9] px-4 py-2 shadow-sm dark:border-zinc-700 dark:bg-[#27272A]">
      <div className="flex flex-col">
        {session ? (
          <>
            <p className="text-md font-medium">
              You are viewing version {version ?? 1}. Restore it to make edits.
            </p>
            <p className="text-sm text-zinc-500">
              Restoring this version will delete all versions after it.
            </p>
          </>
        ) : (
          <p>
            You are viewing version {version ?? 1}. Sign in to restore this
            version and make edits.
          </p>
        )}
      </div>
      <div className="flex flex-row gap-2">
        {session && (
          <Button
            variant="outline"
            onClick={() =>
              window.confirm(
                "Are you sure you want to restore this version?",
              ) &&
              toast.promise(
                restoreVersion.mutateAsync({
                  tripId: params.id,
                  version: version!,
                }),
                {
                  loading: "Restoring version...",
                  success: "Version restored",
                },
              )
            }
          >
            Restore this version
          </Button>
        )}
        <Button onClick={goToLatestVersion}>Go to latest version</Button>
      </div>
    </div>
  );
}
