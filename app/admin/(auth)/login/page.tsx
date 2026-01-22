"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 直接访问 /admin/login 会重定向到首页
// 必须通过 /admin/login/密钥 访问
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // 检查是否已经通过安全入口
    const storedKey = sessionStorage.getItem("admin_access_key");
    const ADMIN_ACCESS_KEY = process.env.NEXT_PUBLIC_ADMIN_ACCESS_KEY;
    
    if (storedKey && (!ADMIN_ACCESS_KEY || storedKey === ADMIN_ACCESS_KEY)) {
      // 已授权，重定向到带密钥的登录页
      router.replace(`/admin/login/${storedKey}`);
    } else {
      // 未授权，重定向到首页
      router.replace("/");
    }
  }, [router]);

  return null;
}
