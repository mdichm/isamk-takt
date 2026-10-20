import type { Metadata } from "next";
import "@takt/design-tokens/css";
import "./globals.css";
import { ShellLayout } from "@/components/shell/ShellLayout";

export const metadata: Metadata = {
  title: "TAKT",
  description: "TAKT - Système de gestion des emplois du temps",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ShellLayout>{children}</ShellLayout>
      </body>
    </html>
  );
}
