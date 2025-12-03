import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barber Demo - BizHelper.AI",
  description: "Experience AI-powered booking for your barbershop",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}