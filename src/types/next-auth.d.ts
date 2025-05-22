import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user:DefaultSession['user']& {
      id: string;
      email: string;
      userType: string;
    };
  }

  interface User extends DefaultUser {
    id: string;
    email: string;
    userType: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    userType: string;
  }
}
