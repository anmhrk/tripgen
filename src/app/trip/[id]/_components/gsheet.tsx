"use client";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { useParams } from "next/navigation";

export function GSheet() {
  // // temp
  // const randomId = Math.random().toString(36).substring(2, 15);
  const params = useParams<{ id: string }>();

  const createNewGsheet = api.gsheets.createNewGsheet.useMutation({
    onSuccess: (data) => {
      toast.success("Google Sheet created successfully");
      console.log(data);
    },
    onError: (error) => {
      toast.error("Failed to create Google Sheet");
      console.error(error);
    },
  });

  return (
    <div className="hidden flex-1 flex-col rounded-xl border bg-white/70 md:flex">
      {/* <iframe
        src={`https://docs.google.com/spreadsheets/d/${randomId}/edit?embedded=true&rm=minimal`}
        className="h-full w-full rounded-xl"
      /> */}

      <Button
        onClick={async () => {
          await createNewGsheet.mutateAsync({ tripId: params.id });
        }}
        className="w-[200px]"
      >
        Create Google Sheet
      </Button>
      {createNewGsheet.isPending && <p>Creating...</p>}
    </div>
  );
}
