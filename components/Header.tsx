'use client';

export default function Header() {

  return (
    <header className="text-center py-4 sm:py-6 bg-zinc-100 dark:bg-zinc-900">
      <div className="flex items-center justify-between px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mx-auto">
          CrewNow
        </h1>
      </div>
    </header>
  );
}