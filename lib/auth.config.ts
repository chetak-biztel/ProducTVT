import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config: no Prisma / bcrypt here so it can run in middleware.
 * The Credentials provider (which touches the DB) is added in lib/auth.ts.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const loggedIn = !!auth?.user;
      const onLogin = nextUrl.pathname.startsWith("/login");
      if (onLogin) {
        if (loggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }
      return loggedIn; // everything else requires a session
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "EMPLOYEE";
        token.username = (user as { username?: string }).username ?? "";
        token.name = user.name ?? "";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
        session.user.name = (token.name as string) ?? session.user.name;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
