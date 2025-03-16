"use client";
import type { Session } from "next-auth";
import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { useIsMobile } from "~/hooks/useIsMobile";

import { motion, AnimatePresence } from "motion/react";
import { Chat } from "./chat";
import { SheetEditor } from "./sheet-editor";
import { MobileSheet } from "./mobile-sheet";
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
  allDetailsCollected: initialAllDetailsCollectedFlag,
  itineraryExists: initialItineraryExistsFlag,
}: LayoutHelperProps) {
  const isMobile = useIsMobile();
  const params = useParams<{ id: string }>();
  const [allDetailsCollected, setAllDetailsCollected] = useState(
    initialAllDetailsCollectedFlag,
  );
  const [itineraryExists, setItineraryExists] = useState(
    initialItineraryExistsFlag,
  );
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [panelGroupKey, setPanelGroupKey] = useState(0);
  const [creatingFirstItinerary, setCreatingFirstItinerary] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const prevMessages = api.trips.getTripMessages.useQuery(
    {
      tripId: params.id,
    },
    {
      refetchOnMount: true,
      staleTime: 1000 * 60 * 5,
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
    initialMessages: prevMessages.data ?? [],
    body: {
      tripId: params.id,
    },
    experimental_throttle: 50,
    onFinish: (response) => {
      if (
        response.content.includes(
          "All right, thanks for providing all the information. Let's get started building your perfect itinerary!",
        )
      ) {
        setAllDetailsCollected(true);
      }
    },
  });

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);

  const handleShowChat = () => {
    setIsChatCollapsed(false);
    // Doing this because the panel resize handle action became inverted after collapsing and uncollapsing the chat
    setPanelGroupKey((prev) => prev + 1);
  };

  useEffect(() => {
    if (!mounted) return;

    const isProcessingSend = status === "submitted" || status === "streaming";

    if (messages.length === 0) {
      // Case 1: Created from form with all details collected, create first itinerary
      if (
        firstMessage &&
        allDetailsCollected &&
        !itineraryExists &&
        !creatingFirstItinerary
      ) {
        setCreatingFirstItinerary(true);
        void append({
          id: crypto.randomUUID(),
          role: "user",
          content: firstMessage,
        });
      }
      // Case 2: Created from prompt, need to collect details
      else if (!allDetailsCollected && !itineraryExists) {
        void append({
          id: crypto.randomUUID(),
          role: "user",
          content: firstMessage,
        });
      }
    }
    // Case 3: Created from prompt, all details collected, create first itinerary
    else if (
      allDetailsCollected &&
      !itineraryExists &&
      !creatingFirstItinerary &&
      !isProcessingSend
    ) {
      setCreatingFirstItinerary(true);
      void append({
        id: crypto.randomUUID(),
        role: "user",
        content: "Please create an itinerary for my trip",
      });
    }
  }, [
    mounted,
    messages,
    allDetailsCollected,
    itineraryExists,
    creatingFirstItinerary,
    firstMessage,
    append,
    status,
  ]);

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
              allDetailsCollected &&
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
              defaultSize={allDetailsCollected && !isMobile ? 30 : 100}
              minSize={10}
              onResize={(size) => {
                if (size < 30 && allDetailsCollected && !isMobile) {
                  setIsChatCollapsed(true);
                }
              }}
            >
              <Chat
                name={name}
                session={session}
                isShared={isShared}
                isOwner={isOwner}
                allDetailsCollected={allDetailsCollected}
                setIsMobileSheetOpen={setIsMobileSheetOpen}
                messages={messages}
                input={input}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                isLoading={status === "submitted" || status === "streaming"}
                stopStream={stop}
                prevMessagesLoading={prevMessages.isLoading}
              />
            </Panel>
          )}

          {allDetailsCollected && !isMobile && (
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
                    <SheetEditor
                      name={name}
                      isOwner={isOwner}
                      session={session}
                      data={data}
                      creatingFirstItinerary={creatingFirstItinerary}
                      setCreatingFirstItinerary={setCreatingFirstItinerary}
                      itineraryExists={itineraryExists}
                      setItineraryExists={setItineraryExists}
                    />
                  </motion.div>
                </AnimatePresence>
              </Panel>
            </>
          )}
        </PanelGroup>
      )}

      {allDetailsCollected && isMobile && (
        <MobileSheet
          name={name}
          isOwner={isOwner}
          open={isMobileSheetOpen}
          setOpen={setIsMobileSheetOpen}
          session={session}
          data={data}
          creatingFirstItinerary={creatingFirstItinerary}
          setCreatingFirstItinerary={setCreatingFirstItinerary}
        />
      )}
    </div>
  );
}
