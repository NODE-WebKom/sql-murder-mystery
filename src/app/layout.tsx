import type { Metadata } from "next";
import "@fontsource-variable/newsreader";
import "@fontsource/special-elite";
import "@fontsource-variable/caveat";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SQL Murder Mystery Bureau",
    template: "%s | SQL Murder Mystery Bureau",
  },
  description:
    "Interrogate the evidence. Query the records. Name the killer.",
  icons: {
    icon: "/bunnyDetective.png",
    apple: "/bunnyDetective.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
