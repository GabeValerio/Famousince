import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import StyledComponentsRegistry from './registry'
import { Providers } from "./providers";
import { ClientLayout } from "./client-layout";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const inter = Inter({ subsets: ['latin'] })

const defaultMetadata = {
  title: 'Famousince - Custom T-Shirts of Your Famous Moment',
  description: 'Design and order custom t-shirts featuring your famous moment. Turn your memorable story into wearable art with fast shipping at Famousince.com',
  url: 'https://famousince.com',
  imageUrl: 'https://res.cloudinary.com/dme5tinla/image/upload/v1751231082/og-image_umtqkj.png'
};

export const metadata: Metadata = {
  metadataBase: new URL('https://famousince.com'),
  title: defaultMetadata.title,
  description: defaultMetadata.description,
  keywords: 'custom t-shirts, personalized shirts, famous moment shirts, custom clothing, print on demand, memorable shirts',
  authors: [{ name: 'Gabriel Valerio' }],
  openGraph: {
    type: 'website',
    siteName: 'Famousince.com',
    url: defaultMetadata.url,
    title: defaultMetadata.title,
    description: defaultMetadata.description,
    images: [
      {
        url: defaultMetadata.imageUrl,
        width: 1200,
        height: 630,
        alt: 'Famousince.com - Custom T-Shirts Logo'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@famousince',
    title: defaultMetadata.title,
    description: defaultMetadata.description,
    images: [defaultMetadata.imageUrl]
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  }
};

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
