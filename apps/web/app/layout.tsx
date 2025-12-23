import { Inter } from "next/font/google";
import "./globals.css";
import { type ReactNode } from "react";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
