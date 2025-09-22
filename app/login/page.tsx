"use client"

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"

function LoginButton({ callbackUrl }: { callbackUrl: string | null }) {
  const handleSignIn = () => {
    signIn("gnagplus", { callbackUrl: callbackUrl || "/" })
  }

  return (
    <button
      onClick={handleSignIn}
      className="px-4 py-2 bg-indigo-700 text-white rounded-full hover:bg-indigo-800 transition-colors cursor-pointer"
    >
      Login mit GnagPlus
    </button>
  )
}

export default function LoginPage() {
  const search = useSearchParams()
  const callbackUrl = search.get("callbackUrl")

  return (
    <main className="flex flex-col">
        <h1 className="mb-4 text-2xl font-bold">
          Anmelden
        </h1>
        <LoginButton callbackUrl={callbackUrl} />
      </main>
  )
}
