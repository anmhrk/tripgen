import "~/styles/globals.css";
import "react-data-grid/lib/styles.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "sonner";
import { TooltipProvider } from "~/components/ui/tooltip";
import { ThemeProvider } from "~/components/theme-provider";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "TripGen - AI trip itinerary planner",
  description: "Plan your perfect trip with AI-powered itineraries",
  icons: [{ rel: "icon", url: "/logo.svg" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen overscroll-none">
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider delayDuration={100} skipDelayDuration={0}>
              <TRPCReactProvider>
                {children}
                <Toaster position="top-center" />
              </TRPCReactProvider>
            </TooltipProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
