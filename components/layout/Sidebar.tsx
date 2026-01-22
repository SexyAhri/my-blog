"use client";

import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  FileTextOutlined,
  FolderOutlined,
  TagsOutlined,
  PictureOutlined,
  SettingOutlined,
  HomeOutlined,
  FileSearchOutlined,
  MessageOutlined,
  BarChartOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/app/providers";
import type { MenuProps } from "antd";

const { Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

const menuItems: MenuItem[] = [
  {
    key: "/admin",
    icon: <DashboardOutlined />,
    label: <Link href="/admin">仪表盘</Link>,
  },
  {
    key: "/admin/posts",
    icon: <FileTextOutlined />,
    label: <Link href="/admin/posts">文章管理</Link>,
  },
  {
    key: "/admin/categories",
    icon: <FolderOutlined />,
    label: <Link href="/admin/categories">分类管理</Link>,
  },
  {
    key: "/admin/tags",
    icon: <TagsOutlined />,
    label: <Link href="/admin/tags">标签管理</Link>,
  },
  {
    key: "/admin/series",
    icon: <BookOutlined />,
    label: <Link href="/admin/series">系列管理</Link>,
  },
  {
    key: "/admin/media",
    icon: <PictureOutlined />,
    label: <Link href="/admin/media">媒体库</Link>,
  },
  {
    key: "/admin/comments",
    icon: <MessageOutlined />,
    label: <Link href="/admin/comments">评论管理</Link>,
  },
  {
    key: "/admin/stats",
    icon: <BarChartOutlined />,
    label: <Link href="/admin/stats">访问统计</Link>,
  },
  {
    key: "/admin/settings",
    icon: <SettingOutlined />,
    label: <Link href="/admin/settings">网站设置</Link>,
  },
  {
    key: "/admin/logs",
    icon: <FileSearchOutlined />,
    label: <Link href="/admin/logs">系统日志</Link>,
  },
  {
    type: "divider",
  },
  {
    key: "/",
    icon: <HomeOutlined />,
    label: (
      <Link href="/" target="_blank">
        访问网站
      </Link>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { themeMode } = useTheme();

  const getSelectedKey = () => {
    if (pathname === "/admin") return "/admin";

    const sortedItems = [...menuItems]
      .filter((item) => item && "key" in item && item.key)
      .sort((a, b) => {
        const keyA = (a as any).key as string;
        const keyB = (b as any).key as string;
        return keyB.length - keyA.length;
      });

    for (const item of sortedItems) {
      const key = (item as any).key as string;
      if (key !== "/admin" && pathname.startsWith(key)) {
        return key;
      }
    }

    return "/admin";
  };

  const siderBg = themeMode === "dark" ? "#141414" : "#ffffff";
  const borderColor = themeMode === "dark" ? "#303030" : "#f0f0f0";

  return (
    <Sider
      width={240}
      style={{
        background: siderBg,
        borderRight: `1px solid ${borderColor}`,
      }}
      theme={themeMode === "dark" ? "dark" : "light"}
    >
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            background: "#2563eb",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: 18,
            marginRight: 12,
          }}
        >
          V
        </div>
        <span
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: themeMode === "dark" ? "#fff" : "#1a1a1a",
            letterSpacing: "-0.3px",
          }}
        >
          VixenAhri
        </span>
      </div>
      <Menu
        theme={themeMode === "dark" ? "dark" : "light"}
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={menuItems}
        style={{
          background: "transparent",
          borderRight: 0,
          padding: "8px 0",
        }}
      />
    </Sider>
  );
}
