'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const { session, logout } = useAuth()
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href + '/'))

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 pb-2">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#F0ECE5]/95 backdrop-blur-sm border border-gray-700 rounded-2xl px-2 py-1.5 flex items-center gap-0.5 shadow-sm">

          {/* Logo */}
          <Link
            href="/"
            className={`px-2.5 py-1.5 text-sm transition-colors rounded-lg ${
              isActive('/') ? 'font-semibold text-ink' : 'text-ink-muted hover:text-ink'
            }`}
          >
            ⚽ Home
          </Link>

          {/* Nav links — only when logged in */}
          {session && (
            <>
              <Link
                href="/tips/group"
                className={`px-2.5 py-1.5 text-sm transition-colors rounded-lg ${
                  isActive('/tips/group') ? 'font-semibold text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                Group
              </Link>
              <Link
                href="/tips/knockout"
                className={`px-2.5 py-1.5 text-sm transition-colors rounded-lg hidden sm:block ${
                  isActive('/tips/knockout') ? 'font-semibold text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                Knockout
              </Link>
              <Link
                href="/results"
                className={`px-2.5 py-1.5 text-sm transition-colors rounded-lg hidden sm:block ${
                  isActive('/results') ? 'font-semibold text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                Results
              </Link>
              {session.is_admin && (
                <Link
                  href="/admin"
                  className={`px-2.5 py-1.5 text-sm transition-colors rounded-lg ${
                    isActive('/admin') ? 'font-semibold text-ink' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  Admin
                </Link>
              )}
            </>
          )}

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2 pl-1">
            {session ? (
              <>
                <button
                  onClick={logout}
                  className="text-xs text-ink-faint hover:text-red-500 transition-colors hidden sm:block"
                >
                  {session.nickname} · sign out
                </button>
                <Link
                  href="/tips/group"
                  className="px-3.5 py-1.5 bg-yellow-400 text-black text-sm font-bold rounded-xl hover:bg-yellow-300 transition-colors whitespace-nowrap"
                >
                  My Tips
                </Link>
              </>
            ) : (
              <Link
                href="/join"
                className="px-3.5 py-1.5 bg-yellow-400 text-black text-sm font-bold rounded-xl hover:bg-yellow-300 transition-colors"
              >
                Join
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  )
}
