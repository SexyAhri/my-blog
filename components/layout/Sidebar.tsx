"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import {
  BarChartOutlined,
  BookOutlined,
  DashboardOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  FolderOutlined,
  HomeOutlined,
  MessageOutlined,
  PictureOutlined,
  SettingOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import { useTheme } from "@/app/providers";

const { Sider } = Layout;

type MenuItem = Required<MenuProps>["items"][number];
type KeyedMenuItem = Extract<NonNullable<MenuItem>, { key: string }>;

const menuItems: MenuItem[] = [
  {
    key: "/admin",
    icon: <DashboardOutlined />,
    label: <Link href="/admin">Dashboard</Link>,
  },
  {
    key: "/admin/posts",
    icon: <FileTextOutlined />,
    label: <Link href="/admin/posts">Posts</Link>,
  },
  {
    key: "/admin/categories",
    icon: <FolderOutlined />,
    label: <Link href="/admin/categories">Categories</Link>,
  },
  {
    key: "/admin/tags",
    icon: <TagsOutlined />,
    label: <Link href="/admin/tags">Tags</Link>,
  },
  {
    key: "/admin/series",
    icon: <BookOutlined />,
    label: <Link href="/admin/series">Series</Link>,
  },
  {
    key: "/admin/media",
    icon: <PictureOutlined />,
    label: <Link href="/admin/media">Media</Link>,
  },
  {
    key: "/admin/comments",
    icon: <MessageOutlined />,
    label: <Link href="/admin/comments">Comments</Link>,
  },
  {
    key: "/admin/stats",
    icon: <BarChartOutlined />,
    label: <Link href="/admin/stats">Analytics</Link>,
  },
  {
    key: "/admin/settings",
    icon: <SettingOutlined />,
    label: <Link href="/admin/settings">Settings</Link>,
  },
  {
    key: "/admin/logs",
    icon: <FileSearchOutlined />,
    label: <Link href="/admin/logs">Logs</Link>,
  },
  {
    type: "divider",
  },
  {
    key: "/",
    icon: <HomeOutlined />,
    label: (
      <Link href="/" target="_blank">
        View site
      </Link>
    ),
  },
];

function hasStringKey(item: MenuItem): item is KeyedMenuItem {
  return Boolean(item && "key" in item && typeof item.key === "string");
}

export function Sidebar() {
  const pathname = usePathname();
  const { themeMode } = useTheme();

  const getSelectedKey = () => {
    if (pathname === "/admin") {
      return "/admin";
    }

    const sortedItems = menuItems
      .filter(hasStringKey)
      .sort((first, second) => second.key.length - first.key.length);

    for (const item of sortedItems) {
      if (item.key !== "/admin" && pathname.startsWith(item.key)) {
        return item.key;
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
