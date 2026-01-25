import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';
import GlobalHeader from '@/components/layout/GlobalHeader';
import GlobalFooter from '@/components/layout/GlobalFooter';
import CookieConsent from '@/components/ui/CookieConsent';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://scentia.fit'),
  title: {
    default: "Scentia | Discover Your Signature Scent",
    template: "%s | Scentia"
  },
  description: "Personalized fragrance recommendations based on your unique taste and preferences. Explore curated perfume selections from top brands.",
  keywords: ["fragrance", "perfume", "scent", "recommendation", "cologne", "beauty", "style", "signature scent"],
  authors: [{ name: "Scentia Team" }],
  verification: {
    google: "K9QQiRBAdIDvQ_0ivxu9sAy6TwoiymCQdq341zz2otQ",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://scentia.fit',
    siteName: 'Scentia',
    title: 'Scentia | Discover Your Signature Scent',
    description: 'Personalized fragrance recommendations based on your unique taste and preferences.',
    images: [
      {
        url: '/og-image.jpg', // Make sure to add a default OG image to public/ later if not exists
        width: 1200,
        height: 630,
        alt: 'Scentia - AI Powered Fragrance Finder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scentia | Discover Your Signature Scent',
    description: 'Personalized fragrance recommendations based on your unique taste and preferences.',
    images: ['/og-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Scentia',
    url: 'https://scentia.fit',
    logo: 'https://scentia.fit/logo.svg', // Ensure you have a logo
    sameAs: [
      'https://twitter.com/scentiaapp', // Replace with your actual socials
      'https://instagram.com/scentiaapp'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@scentia.fit',
      contactType: 'customer support'
    }
  };

  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          <GlobalHeader />
          <main className="pt-16">
            {children}
          </main>
          <GlobalFooter />
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}

