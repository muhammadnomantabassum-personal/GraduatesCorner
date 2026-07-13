import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { WishlistProvider } from '@/lib/wishlist-context'
import { ComparisonProvider } from '@/lib/comparison-context'
import { LogoutLoader } from '@/components/logout-loader'
import { Toaster } from 'sonner'
import './globals.css'

function getSupabaseOrigin() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!value) return null

  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.origin : null
  } catch {
    return null
  }
}

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
  const supabaseOrigin = getSupabaseOrigin()

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        {supabaseOrigin ? <link rel="preconnect" href={supabaseOrigin} /> : null}
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        {supabaseOrigin ? <link rel="dns-prefetch" href={supabaseOrigin} /> : null}
      </head>
      <body className="bg-background font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          <WishlistProvider>
            <ComparisonProvider>
              {children}
              <LogoutLoader />
              <Toaster position="bottom-left" richColors />
            </ComparisonProvider>
          </WishlistProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
