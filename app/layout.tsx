import type { Metadata } from "next";
import "./globals.css";;
import { AppProvider } from "@/lib/context";
import { AppLayout } from "@/components/layout/AppLayout";
import { QueryProvider } from "@/lib/query/provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Legendary Builders - Expense Tracker",
  description: "Mobile-focused expense and income tracking for construction teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
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
