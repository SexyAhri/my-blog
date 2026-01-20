import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { compare } from "bcryptjs";

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
        email: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          await prisma.loginLog.create({
            data: {
              email: credentials?.email,
              success: false,
              message: "用户名或密码为空",
            },
          });
          throw new Error("请输入用户名和密码");
        }

        // 支持用户名或邮箱登录
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
              message: "用户不存在",
            },
          });
          throw new Error("用户不存在");
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
              message: "密码错误",
            },
          });
          throw new Error("密码错误");
        }

        // 登录成功
        await prisma.loginLog.create({
          data: {
            userId: user.id,
            userName: user.name || undefined,
            email: user.email,
            success: true,
            message: "登录成功",
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
        token.role = (user as any).role;
        token.image = (user as any).image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.image = token.image as string | undefined;
      }
      return session;
    },
  },
};
