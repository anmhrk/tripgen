"use client";
import type { Session } from "next-auth";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Chat } from "./chat";
import { SheetEditor } from "./sheet-editor";
import { useIsMobile } from "~/hooks/useIsMobile";
import { MobileSheet } from "./mobile-sheet";

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

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {mounted && (
        <motion.div
          initial={{
            opacity: 0,
            filter: "blur(3px)",
          }}
          animate={{
            opacity: 1,
            filter: "blur(0px)",
          }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
        >
          <Chat
            name={name}
            session={session}
            isShared={isShared}
            isOwner={isOwner}
            firstMessage={firstMessage}
            allDetailsCollected={allDetailsCollected}
            setAllDetailsCollected={setAllDetailsCollected}
            setIsMobileSheetOpen={setIsMobileSheetOpen}
          />
        </motion.div>
      )}

      {mounted && (
        <AnimatePresence>
          {allDetailsCollected && !isMobile && (
            <motion.div
              className="h-full flex-1"
              initial={{
                opacity: 0,
                x: 50,
                width: 0,
              }}
              animate={{
                opacity: 1,
                x: 0,
                width: isMobile ? "100%" : "450px",
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
                width: 0,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                },
              }}
            >
              <SheetEditor name={name} isOwner={isOwner} />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {allDetailsCollected && isMobile && (
        <MobileSheet
          name={name}
          isOwner={isOwner}
          open={isMobileSheetOpen}
          setOpen={setIsMobileSheetOpen}
        />
      )}
    </div>
  );
}
