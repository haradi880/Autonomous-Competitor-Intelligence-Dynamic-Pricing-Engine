import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dynamic Pricing Engine",
  description: "Autonomous competitor intelligence and dynamic pricing dashboard"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
