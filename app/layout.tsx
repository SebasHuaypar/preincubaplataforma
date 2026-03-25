import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

export const metadata: Metadata = {
  title: 'Pre-incubación START Lima | Plataforma del Programa',
  description: 'Plataforma del programa de pre-incubación de START Lima. Accede al calendario de sesiones, mentores y sube tus entregables.',
  keywords: ['START Lima', 'pre-incubación', 'emprendimiento', 'startup', 'Perú'],
  openGraph: {
    title: 'Pre-incubación START Lima',
    description: 'Plataforma del programa de pre-incubación para jóvenes emprendedores de provincias del Perú.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
