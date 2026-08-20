import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GGSIPU Placement Cell",
  description: "Training & Placement Cell Platform — GGSIPU",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
