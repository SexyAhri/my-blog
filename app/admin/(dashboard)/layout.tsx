"use client";

import { App, Layout, Spin, theme } from "antd";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

const { Content } = Layout;
const ADMIN_ACCESS_KEY = process.env.NEXT_PUBLIC_ADMIN_ACCESS_KEY;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token } = theme.useToken();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { message } = App.useApp();
  const hasCheckedAccess = useRef(false);

  const isPostEditPage =
    pathname.includes("/posts/") &&
    (pathname.includes("/edit") || pathname.includes("/new"));

  useEffect(() => {
    if (hasCheckedAccess.current) return;
    hasCheckedAccess.current = true;

    if (ADMIN_ACCESS_KEY) {
      const storedKey = sessionStorage.getItem("admin_access_key");
      if (storedKey !== ADMIN_ACCESS_KEY) {
        router.replace("/");
      }
    }
  }, [router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      message.warning("Session expired");
      router.push("/admin/login");
    }
  }, [message, router, status]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "admin") {
      message.error("Admin access required");
      signOut({ redirect: false });
      router.push("/");
    }
  }, [message, router, session, status]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (!data?.user) {
          message.warning("Session expired");
          signOut({ redirect: false });
          router.push("/admin/login");
          return;
        }

        if (data.user.role !== "admin") {
          message.error("Admin access required");
          signOut({ redirect: false });
          router.push("/");
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    };

    const interval = setInterval(checkSession, 5 * 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [message, router]);

  if (status === "loading") {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: token.colorBgLayout,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <Layout
        style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <Header />
        <Content
          style={{
            margin: isPostEditPage ? 0 : 12,
            padding: isPostEditPage ? 0 : 12,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
          <div
            key={pathname}
            className="page-content"
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {children}
          </div>
        </Content>
        <Footer />
      </Layout>
    </Layout>
  );
}
