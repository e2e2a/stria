import type { Metadata } from 'next';
import { DM_Sans, IBM_Plex_Mono, Merriweather, Roboto } from 'next/font/google';
import './globals.css';
import Providers from '@/components/provider/query-provider';
import { Toaster } from 'react-hot-toast';
import SessionProviderWrapper from '@/components/provider/session-provider';
import SessionGuard from '@/components/provider/session-guard';
import { TooltipProvider } from '@/components/ui/tooltip';

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
});

const ibm = IBM_Plex_Mono({
  variable: '--font-IBM',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

const merriweather = Merriweather({
  variable: '--font-merriweather',
  subsets: ['latin'],
});

const dm_sans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  icons: {
    icon: '/favicon-32x32.png',
    shortcut: '/favicon.ico',
    apple: '/favicon-32x32.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${roboto.variable} ${merriweather.variable} ${dm_sans.variable} ${ibm.variable} antialiased`}>
        <SessionProviderWrapper>
          <Providers>
            <SessionGuard>
              <TooltipProvider delayDuration={1000} skipDelayDuration={3000}>
                {children}
              </TooltipProvider>
              <Toaster position="top-center" reverseOrder={false} />
            </SessionGuard>
          </Providers>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
