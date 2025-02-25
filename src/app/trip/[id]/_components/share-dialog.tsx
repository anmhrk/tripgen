"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";

import {
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

export function ShareDialog({ tripName }: { tripName: string }) {
  const params = useParams<{ id: string }>();
  const [sharePhrase, setSharePhrase] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    setSharePhrase(generateSharePhrase());
  }, []);

  const shareLink = `${process.env.NEXT_PUBLIC_BASE_URL}/trip/${params.id}?share=${sharePhrase}`;

  const shareTrip = api.trips.shareTrip.useMutation({
    onSuccess: async () => {
      toast.success("Share link copied to clipboard");
      setLinkCopied(true);
      await navigator.clipboard.writeText(shareLink);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Share trip: {tripName}</DialogTitle>
        <DialogDescription className="pt-2">
          Share this trip with others using the link below.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2 pb-3">
        <label className="text-sm font-medium">Share Link</label>
        <div className="flex items-center gap-2">
          <Input value={shareLink} readOnly className="text-xs" />
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              shareTrip.mutate({
                tripId: params.id,
                sharePhrase: sharePhrase,
              });
            }}
          >
            {linkCopied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

function generateSharePhrase() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
