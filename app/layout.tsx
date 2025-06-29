import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import StyledComponentsRegistry from './registry'
import { Providers } from "./providers";
import { ClientLayout } from "./client-layout";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Famous Since',
  description: 'Your custom t-shirt designer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`!bg-new-white text-foreground ${inter.className}`}>
        <StyledComponentsRegistry>
          <Providers>
            <ClientLayout>
              {children}
            </ClientLayout>
          </Providers>
        </StyledComponentsRegistry>
        <GoogleAnalytics />
      </body>
    </html>
  )
}
