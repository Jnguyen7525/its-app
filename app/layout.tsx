import type { Metadata } from "next";
import "./globals.css";

import {
  SettingsContextProvider,
  ThemeProvider,
} from "@/shared/settings-context";
import { FathomAnalytics } from "@/components/fathom";
import { TopBar } from "@/components/top-bar";
import StoreProvider from "@/state/redux";
import React from "react";

export const metadata: Metadata = {
  title: "Pragmatic board",
  description:
    "A board powered by Pragmatic drag and drop, React, Tailwind and Lucide",
  authors: { name: "Alex Reardon", url: "https://alexreardon.bsky.social/" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex h-screen flex-col">
        <React.StrictMode>
          <FathomAnalytics />{" "}
          <SettingsContextProvider>
            <ThemeProvider
              themes={{
                light: { background: "bg-white", text: "text-black" },
                dark: { background: "bg-zinc-950", text: "text-white" },
                blue: { background: "bg-blue-600", text: "text-white" },
                pink: { background: "bg-pink-200", text: "text-black" },
              }}
              defaultTheme="dark"
            >
              {" "}
              <StoreProvider>
                <div className="flex flex-col h-full w-full">
                  <TopBar />

                  {/* <FilterBar /> */}
                  {/* position: absolute needed for max-height:100% to be respected internally */}
                  <div className="flex grow flex-col flex-1">
                    {/* <div className="absolute inset-0"> */}
                    <main className="flex-1 overflow-x-hidden  ">
                      {children}
                    </main>
                    {/* </div> */}
                  </div>
                </div>{" "}
              </StoreProvider>
            </ThemeProvider>
          </SettingsContextProvider>{" "}
        </React.StrictMode>
      </body>
    </html>
  );
}
