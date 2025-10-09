'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';

export function ClientGreeting(props: { text?: string }) {
  const trpc = useTRPC();
  const { data, isLoading, error } = useQuery(
    trpc.hello.greeting.queryOptions({ text: props.text })
  );

  if (isLoading) return <div>Loading client greeting…</div>;
  if (error) return <div>Client error: {(error as unknown as Error).message}</div>;
  return <div>Client says: {data?.greeting}</div>;
}
