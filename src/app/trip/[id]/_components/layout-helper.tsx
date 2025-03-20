"use client";
import type { Session } from "next-auth";
import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { useIsMobile } from "~/hooks/useIsMobile";
import type { MessageWithUserInfo, TripState } from "~/lib/types";

import { motion, AnimatePresence } from "motion/react";
import { Chat } from "./chat/chat";
import { Sheet } from "./sheet/sheet";
import { MobileSheet } from "./sheet/mobile-sheet";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";

interface LayoutHelperProps {
  session: Session | null;
  isShared: boolean;
  isOwner: boolean;
  firstMessage: string;
  name: string;
  allDetailsCollected: boolean;
  itineraryExists: boolean;
}

export function LayoutHelper({
  session,
  isShared,
  isOwner,
  firstMessage,
  name,
  allDetailsCollected,
  itineraryExists,
}: LayoutHelperProps) {
  const isMobile = useIsMobile();
  const params = useParams<{ id: string }>();
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [panelGroupKey, setPanelGroupKey] = useState(0);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [tripState, setTripState] = useState<TripState>(
    getInitialTripState(allDetailsCollected, itineraryExists),
  );
  const showItinerary =
    tripState === "ITINERARY_CREATED" || tripState === "CREATING_ITINERARY";

  function getInitialTripState(
    allDetailsCollected: boolean,
    itineraryExists: boolean,
  ): TripState {
    if (allDetailsCollected) {
      return itineraryExists ? "ITINERARY_CREATED" : "DETAILS_COLLECTED";
    }
    return "COLLECTING_DETAILS";
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  const tripData = api.trips.getTripData.useQuery(
    {
      tripId: params.id,
    },
    {
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  );

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    stop,
    append,
    status,
    data,
    error,
  } = useChat({
    initialMessages: tripData.data?.messages ?? [],
    body: {
      tripId: params.id,
      webSearchEnabled,
    },
    experimental_throttle: 50,
    onFinish: (response) => {
      if (
        response.content.includes(
          "All right, thanks for providing all the information. Let's get started building your perfect itinerary!",
        )
      ) {
        setTripState("DETAILS_COLLECTED");
      }
    },
  });

  const handleChatSubmit = () => {
    if (!session) {
      toast.error("Please sign in to send messages");
      return;
    }

    if (status === "submitted" || status === "streaming") {
      stop();
      return;
    }

    handleSubmit();
    setWebSearchEnabled(false);
  };

  const handleShowChat = () => {
    setIsChatCollapsed(false);
    // Doing this because the panel resize handle action became inverted after collapsing and uncollapsing the chat
    setPanelGroupKey((prev) => prev + 1);
  };

  useEffect(() => {
    if (!mounted) return;

    if (tripState === "DETAILS_COLLECTED" && !tripData.isLoading) {
      setTripState("CREATING_ITINERARY");
      if (messages.length === 0) {
        void append({
          id: crypto.randomUUID(),
          role: "user",
          content: firstMessage,
          profileImage: session?.user.image,
          name: session?.user.name,
        } as MessageWithUserInfo);
      } else {
        void append({
          id: crypto.randomUUID(),
          role: "user",
          content: "Please create an itinerary for my trip",
          profileImage: session?.user.image,
          name: session?.user.name,
        } as MessageWithUserInfo);
      }
    } else if (
      tripState === "COLLECTING_DETAILS" &&
      messages.length === 0 &&
      !tripData.isLoading
    ) {
      void append({
        id: crypto.randomUUID(),
        role: "user",
        content: firstMessage,
        profileImage: session?.user.image,
        name: session?.user.name,
      } as MessageWithUserInfo);
    }
  }, [
    tripState,
    append,
    firstMessage,
    session,
    messages.length,
    mounted,
    tripData.isLoading,
  ]);

  useEffect(() => {
    if (error) {
      toast.error("Error: " + error.message);
    }
  }, [error]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {mounted && (
        <PanelGroup
          key={panelGroupKey}
          direction="horizontal"
          className="w-full"
          onLayout={(sizes) => {
            if (
              sizes?.[0] &&
              sizes[0] < 30 &&
              !isChatCollapsed &&
              tripState === "DETAILS_COLLECTED" &&
              !isMobile
            ) {
              setIsChatCollapsed(true);
            }
          }}
        >
          {isChatCollapsed ? (
            <div className="relative">
              <Button
                onClick={handleShowChat}
                className="text-vertical fixed left-0 top-1/2 z-10 h-fit -translate-y-1/2 rounded-r-md bg-zinc-100 px-2 py-6 shadow-md transition-colors hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600"
              >
                <span className="text-sm font-medium [writing-mode:vertical-lr]">
                  Show Chat
                </span>
              </Button>
            </div>
          ) : (
            <Panel
              defaultSize={showItinerary && !isMobile ? 30 : 100}
              minSize={10}
              onResize={(size) => {
                if (size < 30 && showItinerary && !isMobile) {
                  setIsChatCollapsed(true);
                }
              }}
            >
              <Chat
                name={name}
                session={session}
                isShared={isShared}
                isOwner={isOwner}
                setIsMobileSheetOpen={setIsMobileSheetOpen}
                messages={messages as MessageWithUserInfo[]}
                input={input}
                handleInputChange={handleInputChange}
                handleChatSubmit={handleChatSubmit}
                isStreaming={status === "submitted" || status === "streaming"}
                dataLoading={tripData.isLoading}
                showItinerary={showItinerary}
                webSearchEnabled={webSearchEnabled}
                setWebSearchEnabled={setWebSearchEnabled}
              />
            </Panel>
          )}

          {showItinerary && !isMobile && (
            <>
              {!isChatCollapsed && (
                <PanelResizeHandle className="flex w-1.5 cursor-col-resize items-center justify-center bg-zinc-200 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600">
                  <div className="h-8 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                </PanelResizeHandle>
              )}
              <Panel minSize={40} defaultSize={isChatCollapsed ? 100 : 70}>
                <AnimatePresence>
                  <motion.div
                    className="h-full w-full"
                    initial={{
                      opacity: 0,
                      x: 50,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      transition: {
                        delay: 0.1,
                        type: "spring",
                        stiffness: 200,
                        damping: 30,
                      },
                    }}
                    exit={{
                      opacity: 0,
                      x: 50,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      },
                    }}
                  >
                    <Sheet
                      name={name}
                      isOwner={isOwner}
                      session={session}
                      data={data}
                      itineraries={tripData.data?.itineraries}
                      dataLoading={tripData.isLoading}
                      tripState={tripState}
                      setTripState={setTripState}
                    />
                  </motion.div>
                </AnimatePresence>
              </Panel>
            </>
          )}
        </PanelGroup>
      )}

      {showItinerary && isMobile && (
        <MobileSheet
          name={name}
          isOwner={isOwner}
          open={isMobileSheetOpen}
          setOpen={setIsMobileSheetOpen}
          session={session}
          data={data}
          itineraries={tripData.data?.itineraries}
          dataLoading={tripData.isLoading}
          tripState={tripState}
          setTripState={setTripState}
        />
      )}
    </div>
  );
}
