import type { Metadata } from 'next'
import { Geist, Geist_Mono, Lora } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import Nav from '@/components/Nav'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })
const lora = Lora({ variable: '--font-lora', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WC 2026 Tipping',
  description: 'World Cup 2026 tipping bracket for friends',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="bg-gray-950 text-ink min-h-full flex flex-col">
        <AuthProvider>
          <Nav />
          <main className="max-w-2xl mx-auto px-4 pb-20 w-full flex-1 pt-2">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
