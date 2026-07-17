import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from 'next-auth/react'
import { Toaster } from "@/components/ui/toaster"
import { ColorProvider } from '@/contexts/ColorContext'
import ThemeInjector from '@/components/colors/ThemeInjector'
import { InactivityWarning } from '@/components/InactivityWarning'

import '@/lib/i18n'



export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {


  return (
    <SessionProvider session={session}>
      <ColorProvider>
        <ThemeInjector />
        <Component {...pageProps} />
        <Toaster />
        <InactivityWarning />
      </ColorProvider>
    </SessionProvider>
  );
}
