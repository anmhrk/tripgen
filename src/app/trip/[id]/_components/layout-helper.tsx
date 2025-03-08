"use client";

import type { Session } from "next-auth";
import { useState } from "react";

import { motion, AnimatePresence } from "motion/react";
import { Chat } from "./chat";
import { SheetEditor } from "./sheet-editor";
import { useIsMobile } from "~/hooks/useIsMobile";

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

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <motion.div
        className="flex h-full"
        initial={{ width: "100%" }}
        animate={{
          width: allDetailsCollected && !isMobile ? "450px" : "100%",
          transition: {
            type: "spring",
            stiffness: 200,
            damping: 30,
          },
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={allDetailsCollected ? "collected" : "collecting"}
            className="w-full"
            initial={allDetailsCollected ? { scale: 0.98 } : { scale: 1 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
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
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {allDetailsCollected && (
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
    </div>
  );
}
