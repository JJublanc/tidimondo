import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Blog Culinaire - Conseils organisation séjours | TidiMondo",
  description: "Découvrez nos conseils d'experts pour organiser vos séjours culinaires : astuces planification, optimisation courses, gestion groupes. Guides pratiques et témoignages.",
  keywords: ["blog culinaire", "conseils organisation séjours", "astuces planification repas", "optimisation courses", "gestion groupes", "guides pratiques culinaires", "témoignages séjours"],
  openGraph: {
    title: "Blog Culinaire - Conseils organisation séjours | TidiMondo",
    description: "Découvrez nos conseils d'experts pour organiser vos séjours culinaires : astuces planification, optimisation courses, gestion groupes.",
    url: '/blog',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Blog Culinaire - Conseils organisation séjours | TidiMondo",
    description: "Découvrez nos conseils d'experts pour organiser vos séjours culinaires : astuces planification, optimisation courses, gestion groupes.",
  },
  alternates: {
    canonical: '/blog',
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}