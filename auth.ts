import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { accounts, users, db, sessions } from "./lib/db/schema"
import { authConfig } from "./auth.config"

export const { auth, handlers, signIn, signOut } = NextAuth({
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions
    }),
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.name = user.name
                token.picture = user.image
                token.email = user.email
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string
                session.user.name = token.name as string
                session.user.image = token.picture as string
                session.user.email = token.email as string
            }
            return session
        },
        async authorized({ auth }) {
            return !!auth?.user; 
        },
        signIn: async (data) => {
            return true
        }
    },
    ...authConfig
})