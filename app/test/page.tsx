import { HydrateClient, prefetch, trpc, caller } from '@/trpc/server';
import PageHead from '@/components/layout/PageHead';
import { ClientGreeting } from './client-greeting';

export const dynamic = 'force-dynamic';

export default async function TestPage() {
  // Server-seitig: Prefetch in den Query-Cache, damit der Client sofort Daten hat
  prefetch(trpc.hello.greeting.queryOptions({ text: 'from-prefetch' }));

  // Server-seitig: Direkter Router-Call ohne Cache/HTTP (nur als Beispiel)
  const serverResult = await caller.hello.greeting({ text: 'from-server' });

  return (
    <main className="p-4 space-y-4">
      <PageHead title="tRPC Test" subtitle="Server- und Clientaufrufe" />
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Server</h2>
        <div>Server says: {serverResult.greeting}</div>
      </section>

      <HydrateClient>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Client</h2>
          <ClientGreeting text="from-client" />
        </section>
      </HydrateClient>
    </main>
  );
}
