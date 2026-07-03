import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { WishlistProvider } from '@/lib/wishlist-context'
import { LogoutLoader } from '@/components/logout-loader'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://graduatescorner.com'),
  title: 'Graduates Corner - Find Your Academic Opportunity',
  description: 'Discover master theses, PhD positions, and graduate trainee programs from top universities and companies across Sweden and all over the world.',

  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: '/apple-icon.png',
  },

  openGraph: {
    title: 'Graduates Corner',
    description: 'Find master theses, PhD positions, and graduate programs across Sweden and the world.',
    url: 'https://graduatescorner.com', 
    siteName: 'Graduates Corner',
    locale: 'en_US',
    images: [
      {
        url: 'https://graduatescorner.com/og-image.png?v=4',
        alt: 'Graduates Corner GC logo',
        width: 1200,
        height: 630,
      },
    ],
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Graduates Corner',
    description: 'Find academic and career opportunities across Sweden and the world.',
    images: ['https://graduatescorner.com/og-image.png?v=4'],
  },
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="bg-background font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          <WishlistProvider>
            {children}
            <LogoutLoader />
            <Toaster position="bottom-left" richColors />
          </WishlistProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
