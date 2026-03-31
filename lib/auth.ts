import { compare } from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Username or email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          await prisma.loginLog.create({
            data: {
              email: credentials?.email,
              success: false,
              message: "Missing username/email or password",
            },
          });

          throw new Error("Please enter your username or email and password");
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: credentials.email }, { name: credentials.email }],
          },
        });

        if (!user) {
          await prisma.loginLog.create({
            data: {
              email: credentials.email,
              success: false,
              message: "User not found",
            },
          });

          throw new Error("User not found");
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          await prisma.loginLog.create({
            data: {
              userId: user.id,
              userName: user.name || undefined,
              email: user.email,
              success: false,
              message: "Incorrect password",
            },
          });

          throw new Error("Incorrect password");
        }

        await prisma.loginLog.create({
          data: {
            userId: user.id,
            userName: user.name || undefined,
            email: user.email,
            success: true,
            message: "Login successful",
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.image = user.image ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.image = token.image ?? undefined;
      }

      return session;
    },
  },
};
