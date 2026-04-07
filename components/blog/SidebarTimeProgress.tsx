"use client";

import { Card } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";

export default function SidebarTimeProgress() {
  const now = new Date();
  const dayProgress =
    ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100;
  const weekProgress = ((now.getDay() || 7) / 7) * 100;
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const monthProgress = (now.getDate() / daysInMonth) * 100;
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfNextYear = new Date(now.getFullYear() + 1, 0, 1);
  const yearProgress =
    ((now.getTime() - startOfYear.getTime()) /
      (startOfNextYear.getTime() - startOfYear.getTime())) *
    100;

  const items = [
    { label: "Today", value: dayProgress },
    { label: "This Week", value: weekProgress },
    { label: "This Month", value: monthProgress },
    { label: "This Year", value: yearProgress },
  ];

  return (
    <Card
      title={
        <span className="sidebar-card-title">
          <ClockCircleOutlined /> Time Progress
        </span>
      }
      className="blog-sidebar-card"
    >
      <div className="sidebar-progress-list">
        {items.map((item) => (
          <div key={item.label} className="sidebar-progress-item">
            <span>{item.label}</span>
            <div className="sidebar-progress-bar">
              <div
                className="sidebar-progress-fill"
                style={{ width: `${item.value}%` }}
              />
            </div>
            <span>{Math.round(item.value)}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
