import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BreadcrumbNav from "@/components/navigation/breadcrumb-nav";
import { SessionProvider } from "@/components/providers/session-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mental Health Support Platform",
  description:
    "A compassionate mental health support platform combining mood tracking, CBT techniques, and AI-powered conversations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <BreadcrumbNav />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
