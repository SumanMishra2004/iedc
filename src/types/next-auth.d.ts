import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id: string;          // userId
      userType: string;
      email: string|null;       // userEmail
      name: string;        // username
    };
  }

  interface User extends DefaultUser {
    id: string;
    userType: string;
    email: string;
    name: string;
  }

  interface JWT {
    id: string;
    userType: string;
    email: string;
    name: string;
  }
}
