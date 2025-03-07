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
import { Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ShareDialog() {
  const params = useParams<{ id: string }>();
  const [sharePhrase, setSharePhrase] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const getSharePhrase = api.trips.getSharePhrase.useQuery(
    {
      tripId: params.id,
    },
    {
      enabled: false,
      staleTime: 0,
    },
  );

  useEffect(() => {
    void getSharePhrase.refetch();
  }, []);

  useEffect(() => {
    if (getSharePhrase.data) {
      setSharePhrase(getSharePhrase.data);
      setIsShared(true);
    } else {
      setSharePhrase(generateSharePhrase());
    }
  }, [getSharePhrase.data]);

  const shareLink = `${process.env.NEXT_PUBLIC_BASE_URL}/trip/${params.id}?share=${sharePhrase}`;

  const shareTrip = api.trips.shareTrip.useMutation({
    onSuccess: async () => {
      toast.success("Share link copied to clipboard");
      setLinkCopied(true);
      await navigator.clipboard.writeText(shareLink);
      setIsShared(true);
      setTimeout(() => {
        setLinkCopied(false);
      }, 4000);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const unshareTrip = api.trips.unshareTrip.useMutation({
    onSuccess: async () => {
      toast.success("Trip unshared and made private again");
      setIsShared(false);
      setLinkCopied(false);
      setSharePhrase(generateSharePhrase());
      await getSharePhrase.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Share trip</DialogTitle>
        <DialogDescription className="pt-2">
          Share this trip with others using the link below
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5 pb-3">
        <div className="flex items-center gap-2">
          <Input value={shareLink} readOnly className="!text-sm" />
          <Button
            variant="outline"
            size="icon"
            disabled={getSharePhrase.isLoading}
            onClick={async () => {
              if (isShared) {
                toast.success("Share link copied to clipboard");
                await navigator.clipboard.writeText(shareLink);
                setLinkCopied(true);
                setTimeout(() => {
                  setLinkCopied(false);
                }, 4000);
              } else {
                toast.promise(
                  shareTrip.mutateAsync({
                    tripId: params.id,
                    sharePhrase: sharePhrase,
                  }),
                  {
                    loading: "Sharing trip...",
                  },
                );
              }
            }}
          >
            {linkCopied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        {getSharePhrase.isLoading && (
          <div className="flex items-center">
            <Loader2 className="size-6 animate-spin" />
          </div>
        )}
        {isShared && !getSharePhrase.isLoading && (
          <div className="space-y-2">
            <Button
              variant="destructive"
              className="w-[100px]"
              onClick={() => {
                toast.promise(unshareTrip.mutateAsync({ tripId: params.id }), {
                  loading: "Unsharing trip...",
                });
              }}
            >
              Unshare
            </Button>
            <p className="text-xs text-gray-500">
              This will remove the share link and make the trip private again
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function generateSharePhrase() {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
