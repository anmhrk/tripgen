import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "sonner";
import { TooltipProvider } from "~/components/ui/tooltip";

export const metadata: Metadata = {
  title: "TripGen - AI trip itinerary planner",
  description: "Plan your perfect trip with AI-powered itineraries",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} antialiased`}>
      <body className="min-h-screen overscroll-none bg-[#F3F4EF]">
        <TooltipProvider delayDuration={100} skipDelayDuration={0}>
          <TRPCReactProvider>
            {children}
            <Toaster position="top-center" />
          </TRPCReactProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
