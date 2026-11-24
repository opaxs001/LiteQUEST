import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "English Quest · OVA de inglés",
  description:
    "Aventura de rol por turnos para aprender inglés: futuro, be going to, will y señales de tránsito.",
};

export const viewport: Viewport = {
  themeColor: "#0b1325",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
