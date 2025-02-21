import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "TripGen - Plan your perfect trip with AI-powered itineraries",
  description: "Plan your perfect trip with AI-powered itineraries",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body className="bg-[#F3F4EF]">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
