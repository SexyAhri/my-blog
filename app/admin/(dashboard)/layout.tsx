"use client";

import { Layout, theme, App } from "antd";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Spin } from "antd";

const { Content } = Layout;

// 安全入口密钥
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

  // 判断是否是文章编辑页面
  const isPostEditPage =
    pathname.includes("/posts/") &&
    (pathname.includes("/edit") || pathname.includes("/new"));

  // 验证安全入口
  useEffect(() => {
    if (hasCheckedAccess.current) return;
    hasCheckedAccess.current = true;

    // 如果配置了安全密钥，检查 sessionStorage
    if (ADMIN_ACCESS_KEY) {
      const storedKey = sessionStorage.getItem("admin_access_key");
      if (storedKey !== ADMIN_ACCESS_KEY) {
        // 未通过安全入口，重定向到首页
        router.replace("/");
        return;
      }
    }
  }, [router]);

  // Session 过期检测
  useEffect(() => {
    if (status === "unauthenticated") {
      message.warning("登录已过期，请重新登录");
      router.push("/admin/login");
    }
  }, [status, router, message]);

  // 定期检查 session 状态
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (!data?.user) {
          message.warning("登录已过期，请重新登录");
          signOut({ redirect: false });
          router.push("/admin/login");
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    };

    // 每 5 分钟检查一次
    const interval = setInterval(checkSession, 5 * 60 * 1000);
    
    // 页面可见时也检查
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
  }, [router, message]);

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

  if (!session) {
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
