import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { WalletConnect } from "@/components/WalletConnect";

import "./globals.css";
import { SocketProvider } from "@/context/game-state";
import { QueryProvider } from "@/providers/query-provider";
import { ModeToggle } from "@/components/ui/theme-toggle";

export const metadata: Metadata = {
  title: "Symphony Canvas",
  description: "Grab some friends and bring your drawings to life as a song!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <SocketProvider>
              <div className="absolute top-4 right-4 flex items-center gap-4">
                <WalletConnect />
                <ModeToggle />
              </div>
              {children}
            </SocketProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 