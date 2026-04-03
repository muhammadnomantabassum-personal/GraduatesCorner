import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { WishlistProvider } from '@/lib/wishlist-context'
import { LogoutLoader } from '@/components/logout-loader'
import { Toaster } from 'sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'GraduatesCorner - Find Your Academic Opportunity',
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
    title: 'GraduatesCorner',
    description: 'Find master theses, PhD positions, and graduate programs across Sweden and the world.',
    url: 'https://graduatescorner.com', 
    siteName: 'GraduatesCorner',
    images: [
      {
        url: 'https://graduatescorner.com/og-image.png?v=2', // VERY IMPORTANT
        width: 1200,
        height: 630,
      },
    ],
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'GraduatesCorner',
    description: 'Find academic and career opportunities across Sweden and the world.',
    images: ['https://graduatescorner.com/og-image.png?v=2'],
  },
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-[#F8FAFC]" suppressHydrationWarning>
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
