import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ISL Studio',
  description: 'AI-powered Indian Sign Language (ISL) communication support. Transcribe and translate spoken languages.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className={`${inter.variable} h-full`}>
      <head>
        <meta name="google-signin-client_id" content="296985274030-f93560bdb618m9gptg601ospct9hlcg6.apps.googleusercontent.com" />
        <Script
          src="https://apis.google.com/js/platform.js"
          strategy="beforeInteractive"
          async
          defer
        />
      </head>
      <body className={'h-full font-body antialiased'}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
