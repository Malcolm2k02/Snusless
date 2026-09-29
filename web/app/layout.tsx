import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "SnusLess — På dina villkor", description: "Förstå dina snusvanor. Små steg, på dina villkor.", icons: { icon: "/favicon.svg" } };
export default function RootLayout({ children }: Readonly<{
    children: React.ReactNode;
}>) { return <html lang="sv"><body>{children}</body></html>; }
