import type { Metadata } from "next";
import "./globals.css";;
import { AppProvider } from "@/lib/context";
import { AppLayout } from "@/components/layout/AppLayout";
import { QueryProvider } from "@/lib/query/provider";
import { Toaster } from "@/components/ui/sonner";
import { RegisterServiceWorker } from "./register-sw";

export const metadata: Metadata = {
  title: "Legendary Builders - Expense Tracker",
  description: "Mobile-focused expense and income tracking for construction teams",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Legendary Builders",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="antialiased">
        <RegisterServiceWorker />
        <QueryProvider>
          <AppProvider>
            <AppLayout>
              {children}
            </AppLayout>
            <Toaster />
          </AppProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
