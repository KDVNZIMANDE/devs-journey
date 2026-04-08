import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DevBuild — Build in public",
  description: "A platform for developers to build in public, track progress, collaborate, and celebrate shipped projects.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className={`${geist.className} min-h-full bg-gray-50 text-gray-900 antialiased`}>
          <Header />
          {children}
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
