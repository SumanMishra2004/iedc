import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";

import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Sign in",
      id: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "example@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          return null;
        }

  // Get userType from userdetails
  const userDetails = await prisma.userDetails.findUnique({
    where: { email: credentials.email },
  });

        return {
          id: user.id,
          email: user.email,
          userType: userDetails?.userType||'STUDENT', // Ensure userType is included as required by the User interface
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!dbUser) {
          // Fetch userType from userdetails
          const userDetails = await prisma.userDetails.findUnique({
            where: { email: user.email! },
          });

          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || "Google User",
              profileImage: (profile as any)?.picture || null,
              isVerified: true,
              userType: userDetails?.userType || "STUDENT", // default fallback
            },
          });
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        // On initial sign-in (credentials or google), user object exists
        token.id = user.id;
        token.email = user.email;

        if (user.userType) {
          // Credentials provider passes userType directly
          token.userType = user.userType;
        } else {
          // For Google provider, user.userType may be missing
          // Fetch userType from DB based on email
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });
          console.log("DB User:", dbUser);

          token.userType = dbUser?.userType || "STUDENT"; // Default to STUDENT if not found
        }
      }
      return token;
    },

    async session({ session, token }) {
      return {
        user: {
          id: token.id as string,
          email: token.email as string,
          userType: token.userType as string,
        },
        expires: session.expires,
      };
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
