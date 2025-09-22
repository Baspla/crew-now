export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-black text-zinc-900 dark:text-gray-100">
      <div className="w-full max-w-xs space-y-8">
        {children}
      </div>
    </div>
  );
}