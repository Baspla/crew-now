import Header from "@/components/layout/Header";
import Navigation from "@/components/layout/Navigation";


export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Mobile Layout */}
      <div className="md:hidden max-w-2xl mx-auto min-h-screen bg-zinc-50 dark:bg-black text-gray-900 dark:text-gray-100">
        <Header />
        <Navigation />
        <main className="p-4">
          {children}
        </main>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block min-h-screen bg-zinc-50 dark:bg-black text-gray-900 dark:text-gray-100">
        <div className="flex max-w-6xl mx-auto gap-6 p-6">
          <aside className="flex-shrink-0">
            <Navigation />
          </aside>
          <main className="flex-1 max-w-2xl bg-zinc-100 dark:bg-black rounded-lg p-6">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
