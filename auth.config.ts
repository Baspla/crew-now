import { NextAuthConfig, Profile } from "next-auth"

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login"
  },
  trustHost: true,
  providers: [
    {
      type: "oidc",
      id: "gnagplus",
      name: "GnagPlus",
      issuer: process.env.OIDC_ISSUER,
      clientId: process.env.OIDC_CLIENT_ID,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid profile"
        }
      },
      profile(profile: Profile) {
        return {
          id: profile.sub!,
          name: profile.display_name as string || profile.preferred_username || profile.name,
          image: profile.picture
        }
      }
    }
  ]
} satisfies NextAuthConfig