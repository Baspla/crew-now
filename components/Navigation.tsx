import Link from 'next/link';
import SignOutButton from './SignOutButton';
import { Suspense } from 'react';
import PostingStatusClient from './PostingStatusClient';

export default function Navigation() {
  return (
    <nav className="
      /* Mobile: horizontal nav at top */
      flex justify-center space-x-4 py-3 sticky top-0 bg-zinc-50 dark:bg-zinc-800 z-10
      /* Desktop: vertical nav on left */
      md:flex-col md:space-x-0 md:space-y-2 md:justify-start md:sticky md:top-4 md:h-fit md:w-48 md:p-4 md:bg-zinc-100 md:dark:bg-zinc-900 md:rounded-lg
    ">
      {/* App name - only visible on desktop */}
      <div className="hidden md:block mb-4 pb-2">
        <h2 className="text-2xl px-2 font-bold text-gray-900 dark:text-white">
          CrewNow
        </h2>
      </div>
      {/* Timer within window */}
      <Suspense fallback={null}>
        <div className="flex-1 border-b border-gray-200 dark:border-gray-700 mb-0" />
        <div className="text-xl font-bold flex flex-row justify-center text-gray-700 dark:text-gray-300 my-2">
          <PostingStatusClient />
        </div>
        <div className="flex-1 border-b border-gray-200 dark:border-gray-700" />
      </Suspense>
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
        Moments
      </Link>
      <Link 
        href="/profile" 
        className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors px-2 py-1 md:px-3 md:py-2 md:rounded-md md:hover:bg-gray-100 md:dark:hover:bg-zinc-800"
      >
        Profil
      </Link>
      <div className="flex-1 border-b border-gray-200 dark:border-gray-700" />
      <SignOutButton 
        className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors px-2 py-1 md:px-3 md:py-2 md:rounded-md md:hover:bg-gray-100 md:dark:hover:bg-zinc-800 text-left cursor-pointer"
      />
    </nav>
  );
}