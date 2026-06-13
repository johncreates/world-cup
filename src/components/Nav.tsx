'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const { session, logout } = useAuth()
  const pathname = usePathname()

  const link = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      className={`text-sm font-medium transition-colors ${
        pathname === href || pathname.startsWith(href + '/')
          ? 'text-yellow-400'
          : 'text-gray-400 hover:text-white'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header className="border-b border-gray-800 mb-6">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6">
        <Link href="/" className="font-bold text-lg text-yellow-400 shrink-0">
          ⚽ WC 2026
        </Link>
        {session && (
          <nav className="flex items-center gap-4 flex-wrap flex-1">
            {link('/tips/group', 'Group Stage')}
            {link('/tips/knockout', 'Knockout')}
            {link('/leaderboard', 'Leaderboard')}
            {link('/results', 'Results')}
            {session.is_admin && link('/admin', 'Admin')}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-3 shrink-0">
          {session ? (
            <>
              <span className="text-sm text-gray-400 hidden sm:inline">
                {session.nickname}
              </span>
              <button
                onClick={logout}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/" className="text-sm text-yellow-400 hover:text-yellow-300">
              Join
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
