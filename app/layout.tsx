import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { WishlistProvider } from '@/lib/wishlist-context'
import { ComparisonProvider } from '@/lib/comparison-context'
import { LogoutLoader } from '@/components/logout-loader'
import { Toaster } from 'sonner'
import { JsonLd } from '@/components/seo/json-ld'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, SOCIAL_PROFILES, absoluteUrl } from '@/lib/seo'
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

const googleVerification = process.env.GOOGLE_SITE_VERIFICATION
const bingVerification = process.env.BING_SITE_VERIFICATION

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'PhD Positions, Master\'s Theses and Graduate Programs | Graduates Corner',
    template: '%s | Graduates Corner',
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'education and employment',
  keywords: [
    'PhD positions',
    'doctoral positions',
    'master thesis positions',
    'graduate trainee programs',
    'academic opportunities',
    'research jobs',
  ],
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    types: {
      'application/rss+xml': absoluteUrl('/feed.xml'),
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: {
    ...(googleVerification ? { google: googleVerification } : {}),
    ...(bingVerification ? { other: { 'msvalidate.01': bingVerification } } : {}),
  },

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
    title: 'PhD Positions, Master\'s Theses and Graduate Programs',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
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
    title: 'PhD Positions, Master\'s Theses and Graduate Programs',
    description: SITE_DESCRIPTION,
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
        <JsonLd
          data={[
            {
              '@context': 'https://schema.org',
              '@type': 'Organization',
              '@id': `${SITE_URL}/#organization`,
              name: SITE_NAME,
              url: SITE_URL,
              logo: absoluteUrl('/logo.png'),
              email: 'admin@graduatescorner.com',
              sameAs: SOCIAL_PROFILES,
            },
            {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              '@id': `${SITE_URL}/#website`,
              name: SITE_NAME,
              url: SITE_URL,
              description: SITE_DESCRIPTION,
              publisher: { '@id': `${SITE_URL}/#organization` },
              inLanguage: 'en',
            },
          ]}
        />
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
