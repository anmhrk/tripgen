"use client";
import type { Session } from "next-auth";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";
import { useCustomChat } from "~/hooks/useCustomChat";

import { Chat } from "./chat";
import { SheetEditor } from "./sheet-editor";
import { useIsMobile } from "~/hooks/useIsMobile";
import { MobileSheet } from "./mobile-sheet";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";

interface LayoutHelperProps {
  session: Session | null;
  isShared: boolean;
  isOwner: boolean;
  firstMessage: string;
  name: string;
  allDetailsCollected: boolean;
}

export function LayoutHelper({
  session,
  isShared,
  isOwner,
  firstMessage,
  name,
  allDetailsCollected: initialAllDetailsCollectedFlag,
}: LayoutHelperProps) {
  const [allDetailsCollected, setAllDetailsCollected] = useState(
    initialAllDetailsCollectedFlag,
  );
  const isMobile = useIsMobile();
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const params = useParams<{ id: string }>();
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

  const chat = useCustomChat({
    session,
    tripId: params.id,
    initialMessages: prevMessages.data ?? [],
    setAllDetailsCollected,
  });

  const {
    messages,
    input,
    isLoading,
    append,
    handleInputChange,
    handleSubmit,
    stopStream,
    csvContent,
  } = chat;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {mounted && (
        <PanelGroup direction="horizontal" className="w-full">
          <Panel
            defaultSize={allDetailsCollected && !isMobile ? 30 : 100}
            minSize={30}
          >
            <Chat
              name={name}
              session={session}
              isShared={isShared}
              isOwner={isOwner}
              firstMessage={firstMessage}
              allDetailsCollected={allDetailsCollected}
              setIsMobileSheetOpen={setIsMobileSheetOpen}
              prevMessages={prevMessages.data ?? []}
              messages={messages}
              input={input}
              isLoading={isLoading}
              append={append}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              stopStream={stopStream}
              prevMessagesLoading={prevMessages.isLoading}
            />
          </Panel>

          {allDetailsCollected && !isMobile && (
            <>
              <PanelResizeHandle className="w-1 bg-zinc-200 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600" />
              <Panel minSize={40}>
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
                      csvContent={csvContent}
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
          csvContent={csvContent}
        />
      )}
    </div>
  );
}
