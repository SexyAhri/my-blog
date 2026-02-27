"use client";

import { useRouter } from "next/navigation";
import { FireOutlined, ThunderboltOutlined } from "@ant-design/icons";

type SortType = "latest" | "hot" | "liked";

const sortTabs = [
  { key: "latest" as SortType, label: "最新文章", icon: null },
  { key: "hot" as SortType, label: "热门文章", icon: <FireOutlined /> },
  {
    key: "liked" as SortType,
    label: "点赞最多",
    icon: <ThunderboltOutlined />,
  },
];

export default function SortTabs({ currentSort }: { currentSort: SortType }) {
  const router = useRouter();

  return (
    <div className="article-tabs">
      {sortTabs.map((tab) => (
        <button
          key={tab.key}
          className={`article-tab ${currentSort === tab.key ? "active" : ""}`}
          onClick={() => router.push(`/?page=1&sort=${tab.key}`)}
        >
          {tab.icon && <span className="article-tab-icon">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
