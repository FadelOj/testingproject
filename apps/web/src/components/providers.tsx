"use client";

import { useAuth } from "@clerk/nextjs";
import { env } from "@testingproject/env/web";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

const FALLBACK_CONVEX_URL = "https://valuable-echidna-466.eu-west-1.convex.cloud";
const convexUrl = env.NEXT_PUBLIC_CONVEX_URL.includes("127.0.0.1:3210")
  ? FALLBACK_CONVEX_URL
  : env.NEXT_PUBLIC_CONVEX_URL;
const convex = new ConvexReactClient(convexUrl);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
      <Toaster richColors />
    </ThemeProvider>
  );
}
