import Link from 'next/link';
import SignOutButton from './SignOutButton';

export default function Navigation() {
  return (
    <>
      {/* Mobile navigation */}
      <div className="md:hidden sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <nav className="flex items-center gap-1 px-2 py-2">
          <Link
            href="/feed"
            className="flex-1 text-center text-xs font-medium text-gray-700 dark:text-gray-300 px-2 py-2 rounded-md hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Feed
          </Link>
          <Link
            href="/moments"
            className="flex-1 text-center text-xs font-medium text-gray-700 dark:text-gray-300 px-2 py-2 rounded-md hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Archiv
          </Link>
          <Link
            href="/create"
            className="flex-1 flex justify-center text-sm font-semibold  text-white hover:text-blue-600 active:bg-blue-800 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
              <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
              <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
            </svg>
          </Link>
          <Link
            href="/profile"
            className="flex-1 text-center text-xs font-medium text-gray-700 dark:text-gray-300 px-2 py-2 rounded-md hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Profil
          </Link>
          <Link href="/settings" className="flex-1 text-center text-xs font-medium text-gray-700 dark:text-gray-300 px-2 py-2 rounded-md hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
            Einstellungen
          </Link>
        </nav>
      </div>

      {/* Desktop navigation */}
      <div className="hidden md:block md:sticky md:top-4 md:h-fit md:w-48">
        <nav className="flex flex-col space-y-2 justify-start p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
          {/* App name */}
          <div className="mb-2 pb-2">
            <h2 className="text-2xl px-2 font-bold text-gray-900 dark:text-white">
              CrewNow
            </h2>
          </div>

          <Link
            href="/feed"
            className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors px-2 py-1 md:px-3 md:py-2 md:rounded-md md:hover:bg-gray-100 md:dark:hover:bg-zinc-800"
          >
            Feed
          </Link>
          <Link
            href="/create"
            className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors px-2 py-1 md:px-3 md:py-2 md:rounded-md md:hover:bg-gray-100 md:dark:hover:bg-zinc-800"
          >
            Posten
          </Link>
          <Link
            href="/moments"
            className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors px-2 py-1 md:px-3 md:py-2 md:rounded-md md:hover:bg-gray-100 md:dark:hover:bg-zinc-800"
          >
            Archiv
          </Link>
          <Link
            href="/profile"
            className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors px-2 py-1 md:px-3 md:py-2 md:rounded-md md:hover:bg-gray-100 md:dark:hover:bg-zinc-800"
          >
            Profil
          </Link>
          <Link
            href="/settings"
            className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors px-2 py-1 md:px-3 md:py-2 md:rounded-md md:hover:bg-gray-100 md:dark:hover:bg-zinc-800"
          >
            Einstellungen
          </Link>

          <div className="flex-1 border-b border-gray-200 dark:border-gray-700" />
          <SignOutButton
            className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors px-2 py-1 md:px-3 md:py-2 md:rounded-md md:hover:bg-gray-100 md:dark:hover:bg-zinc-800 cursor-pointer"
          />
        </nav>
      </div>
    </>
  );
}