'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Links', href: '/dashboard/links' },
  { label: 'Appearance', href: '/dashboard/appearance' },
  { label: 'Chatbot Memory', href: '/dashboard/memory' },
  { label: 'Analytics', href: '/dashboard/analytics' },
  { label: 'Chats', href: '/dashboard/chats' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/10 bg-gray-950">
      <div className="px-6 py-6">
        <Link href="/dashboard" className="text-xl font-bold text-white">
          LinkChat
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
