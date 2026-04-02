import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/hooks/use-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agency Suite — AI-Powered Tools for Marketing Agencies",
  description: "Generate weekly client reports and proposals with AI. Built for performance marketing agencies.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
