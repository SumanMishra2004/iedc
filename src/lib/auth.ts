import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import { comparePassword } from "@/utils/hash";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const isValid = await comparePassword(credentials.password, user.password);
        if (!isValid) return null;

        if (!user.isVerified) return null;

        const userDetails = await prisma.userDetails.findUnique({
          where: { email: credentials.email },
        });


      console.log("User details:", userDetails);
      

        if(userDetails){
          await prisma.user.update({
            where:{email:credentials.email},
            data:{
              userType:userDetails.userType,
              isVerified:true,
            }
          })
        }
        return {
          id: user.id,
          email: user.email,
          userType: userDetails?.userType || "STUDENT",
          name: user.name,
        };
      },
    }),
    // other providers, e.g. GoogleProvider here
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.userType = user.userType;
        token.name = user.name;
      }
      return token;
    },

    async session({ session, token }) {
  return {
    ...session,
    user: {
      id: token.id as string,
      email: token.email as string,
      name: token.name as string,
      userType: token.userType as string,
    },
  };
}

  },

  pages: {
    signIn: "/signup",
    error: "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
