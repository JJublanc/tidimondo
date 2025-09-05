import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TidiMondo - Planifiez vos séjours culinaires en toute sérénité",
    template: "%s | TidiMondo"
  },
  description: "TidiMondo vous aide à planifier vos séjours culinaires : créez vos recettes, planifiez vos repas jour par jour, générez vos listes de courses automatiquement. Idéal pour vacances, centres de loisirs et événements.",
  keywords: ["planification culinaire", "séjours gastronomiques", "organisation repas", "liste courses automatique", "gestion recettes", "planification repas groupe", "centres vacances", "menu planning"],
  authors: [{ name: "TidiMondo" }],
  creator: "TidiMondo",
  publisher: "TidiMondo",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://tidimondo.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "TidiMondo - Planifiez vos séjours culinaires en toute sérénité",
    description: "TidiMondo vous aide à planifier vos séjours culinaires : créez vos recettes, planifiez vos repas jour par jour, générez vos listes de courses automatiquement.",
    url: '/',
    siteName: 'TidiMondo',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "TidiMondo - Planifiez vos séjours culinaires en toute sérénité",
    description: "TidiMondo vous aide à planifier vos séjours culinaires : créez vos recettes, planifiez vos repas jour par jour, générez vos listes de courses automatiquement.",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="fr">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
